import TypeIdentifiers from './Modules/TypeIdentifiers.js';

// I know a lot of this code is poor quality, but this is a work in progress, and I will be refactoring it; at the moment, I'm just focusing on getting something that works

// isFloat polyfill
if (!Number.prototype.isFloat) {
	Number.prototype.isFloat = function() {
		return this.valueOf() % 1 !== 0;
	}
}

class MsgpackEncoder {
	constructor() {
		this.byteArray = new Uint8Array(128);
		this.index = 0;
	}

	encode(data) {
		this.appendData(data);

		return this.byteArray.slice(0, this.index);
	}

	appendData(data) {
		switch (typeof data) {
			case 'boolean':
				this.appendBool(data);
				break;

			case 'number':
				this.appendNumber(data);
				break;

			case 'string':
				this.appendString(data);
				break;

			case 'object':
				if (data === null) return this.appendNull();
				if (data instanceof Uint8Array || data instanceof Uint8ClampedArray) return this.appendBinArray(data);
				if (data instanceof Array) return this.appendArray(data);
				this.appendObject(data);
				break;
		}
	}

	createByteArray(bufferSize, dataViewFunction, data) {
		const buffer = new ArrayBuffer(bufferSize);
		const dataView = new DataView(buffer);

		dataView[dataViewFunction](0, data);

		const byteArray = new Uint8Array(buffer);

		return byteArray;
	}


	appendNull() {
		this.appendByte(TypeIdentifiers.nil);
	}

	appendFixArrayLength(array) {
		this.appendByte(TypeIdentifiers.fixArray + array.length);
	}

	append16ByteArrayLength(array) {
		this.appendByte(TypeIdentifiers.var_16ByteLengthArray);

		const encodedArrayLength = this.createByteArray(2, 'setUint16', array.length)
		this.appendBytes(encodedArrayLength);
	}

	append32ByteArrayLength(array) {
		this.appendByte(TypeIdentifiers.var_32ByteLengthArray);

		const encodedArrayLength = this.createByteArray(4, 'setUint32', array.length);
		this.appendBytes(encodedArrayLength);
	}

	appendArrayLength(array) {
		const isFixArray = array.length >= 0 && array.length < 15;
		const is16ByteLengthArray = array.length >= 15 && array.length < (2 ** 16) - 1;
		const is32ByteLengthArray = array.length >= (2 ** 16) && array.length <= (2 ** 32) - 1;

		if (isFixArray) {
			this.appendFixArrayLength(array)
		} else if (is16ByteLengthArray) {
			this.append16ByteArrayLength(array);
		} else if (is32ByteLengthArray) {
			this.append32ByteArrayLength(array);
		}
	}

	appendArray(array) {
		this.appendArrayLength(array);

		array.forEach((element) => {
			this.appendData(element);
		});
	}

	appendFixMapLength(objectLength) {
		this.appendByte(TypeIdentifiers.fixMap + objectLength);
	}

	append16ByteMapLength(objectLength) {
		this.appendByte(TypeIdentifiers.var_16ByteMap);

		const encodedObjectLength = this.createByteArray(2, 'setUint16', objectLength);
		this.appendBytes(encodedObjectLength);
	}

	append32ByteMapLength(objectLength) {
		this.appendByte(TypeIdentifiers.var_32ByteMap);

		const encodedObjectLength = this.createByteArray(4, 'setUint32', objectLength);
		this.appendBytes(encodedObjectLength);
	}

	appendObjectLength(object) {
		const objectKeys = Object.keys(object);
		const objectLength = objectKeys.length;

		const isFixMap = objectLength >= 0 && objectLength < 15;
		const is16ByteMap = objectLength >= 15 && objectLength < (2 ** 16) - 1;
		const is32ByteMap = objectLength >= (2 ** 16) - 1 && objectLength < (2 ** 32) - 1;

		if (isFixMap) {
			this.appendFixMapLength(objectLength);
		} else if (is16ByteMap) {
			this.append16ByteMapLength(objectLength);
		} else if (is32ByteMap) {
			this.append32ByteMapLength(objectLength);
		}
	}

	appendObject(object) {
		this.appendObjectLength(object);

		for (const key of Object.keys(object)) {
			this.appendData(key);
			this.appendData(object[key]);
		}
	}

	appendFixStringLength(stringLength) {
		this.appendByte(TypeIdentifiers.fixStr + stringLength);
	}

	append8ByteStringLength(stringLength) {
		this.appendBytes([TypeIdentifiers.var_8ByteLengthStr, stringLength]);
	}

	append16ByteStringLength(stringLength) {
		this.appendByte(TypeIdentifiers.var_16ByteLengthStr);

		const encodedStringLength = this.createByteArray(2, 'setUint16', stringLength);
		this.appendBytes(encodedStringLength);
	}

	append32ByteStringLength(stringLength) {
		this.appendByte(TypeIdentifiers.var_16ByteLengthStr);

		const encodedStringLength = this.createByteArray(4, 'setUint32', stringLength);
		this.appendBytes(encodedStringLength);
	}

	appendStringLength(stringLength) {
		const isFixStr = stringLength > 0 && stringLength < 32;
		const is8ByteLengthStr = stringLength >= 32 && stringLength < (2 ** 8) - 1;
		const is16ByteLengthStr = stringLength >= (2 ** 8) - 1 && stringLength < (2 ** 16) - 1;
		const is32ByteLengthStr = stringLength >= (2 ** 16) - 1 && stringLength < (2 ** 32) - 1;

		if (isFixStr) {
			this.appendFixStringLength(stringLength);
		} else if (is8ByteLengthStr) {
			this.append8ByteStringLength(stringLength);
		} else if (is16ByteLengthStr) {
			this.append16ByteStringLength(stringLength);
		} else if (is32ByteLengthStr) {
			this.append32ByteStringLength(stringLength);
		}
	}

	appendString(string) {
		this.appendStringLength(string.length);

		const encodedStringData = new TextEncoder().encode(string);
		this.appendBytes(encodedStringData);
	}

	append8BitUnsignedInt(number) {
		this.appendByte(TypeIdentifiers.var_8BitUnsignedInt);
		this.appendByte(number);
	}

	append16BitUnsignedInt(number) {
		this.appendByte(TypeIdentifiers.var_16BitUnsignedInt);

		const encodedInteger = this.createByteArray(2, 'setUint16', number);
		this.appendBytes(encodedInteger);
	}

	append32BitUnsignedInt(number) {
		this.appendByte(TypeIdentifiers.var_32BitUnsignedInt);

		const encodedInteger = this.createByteArray(4, 'setUint32', number);
		this.appendBytes(encodedInteger);
	}

	append64BitUnsignedInt(number) {
		this.appendByte(TypeIdentifiers.var_32BitUnsignedInt);

		const encodedInteger = this.createByteArray(8, 'setUint64', number);
		this.appendBytes(encodedInteger);
	}

	append8BitSignedInt(number) {
		this.appendByte(TypeIdentifiers.var_8BitSignedInt);
		this.appendByte(number);
	}

	append16BitSignedInt(number) {
		this.appendByte(TypeIdentifiers.var_16BitSignedInt);
		const encodedInteger = this.createByteArray(2, 'setInt16', number);
		this.appendBytes(encodedInteger);
	}

	append32BitSignedInt(number) {
		this.appendByte(TypeIdentifiers.var_32BitSignedInt);
		const encodedInteger = this.createByteArray(4, 'setInt32', number);
		this.appendBytes(encodedInteger);
	}

	append64BitSignedInt(number) {
		this.appendByte(TypeIdentifiers.var_64BitSignedInt);
		const encodedInteger = this.createByteArray(8, 'setInt64', number);
		this.appendBytes(encodedInteger);
	}

	appendInt(number) {
		const isUnsignedFixint = number >= (2 ** 0) - 1 && number < (2 ** 7);
		const isSignedFixint = number >= -(2 ** 5) - 1 && number < (2 ** 0);

		const is8BitUnsignedInt = number >= (2 ** 0) - 1 && number < (2 ** 8);
		const is16BitUnsignedInt = number >= (2 ** 8) - 1 && number < (2 ** 16);
		const is32BitUnsignedInt = number >= (2 ** 16) - 1 && number < (2 ** 32);
		const is64BitUnsignedInt = number >= (2 ** 32) - 1 && number < (2 ** 64);

		const is8BitSignedInt = number >= -(2 ** 7) - 1 && number < (2 ** 7);
		const is16BitSignedInt = number >= -(2 ** 15) - 1 && number < (2 ** 15);
		const is32BitSignedInt = number >= -(2 ** 31) - 1 && number < (2 ** 31);
		const is64BitSignedInt = number >= -(2 ** 65) - 1 && number < (2 ** 65);

		if (isUnsignedFixint || isSignedFixint) {
			return this.appendByte(number);
		} else if (is8BitUnsignedInt) {
			return this.append8BitUnsignedInt(number);
		} else if (is16BitUnsignedInt) {
			return this.append16BitUnsignedInt(number);
		} else if (is32BitUnsignedInt) {
			return this.append32BitUnsignedInt(number);
		} else if (is64BitUnsignedInt) {
			return this.append64BitUnsignedInt(number);
		} else if (is8BitSignedInt) {
			return this.append8BitSignedInt(number);
		} else if (is16BitSignedInt) {
			return this.append16BitSignedInt(number);
		} else if (is32BitSignedInt) {
			return this.append32BitSignedInt(number);
		} else if (is64BitSignedInt) {
			return this.append64BitSignedInt(number);
		}
	}

	appendFloat(number) {
		this.appendByte(TypeIdentifiers.float64);

		const encodedInteger = this.createByteArray(8, 'setFloat64', number);
		this.appendBytes(encodedInteger);
	}

	appendNumber(number) {
		if (number.isFloat()) {
			this.appendFloat(number);
		} else {
			this.appendInt(number);
		}
	}

	append8ByteBinArray(binArray) {
		this.appendBytes([TypeIdentifiers.var_8ByteLengthBinArray, binArray.length]);
	}

	append16ByteBinArray(binArray) {
		this.appendByte(TypeIdentifiers.var_16ByteLengthBinArray);
		const encodedBinArrayLength = this.createByteArray(2, 'setUint16', binArray.length);
		this.appendBytes(encodedBinArrayLength);
	}

	append32ByteBinArray(binArray) {
		this.appendByte(TypeIdentifiers.var_32ByteLengthBinArray);
		const encodedBinArrayLength = this.createByteArray(4, 'setUint32', binArray.length);
		this.appendBytes(encodedBinArrayLength);
	}

	appendBinArray(binArray) {
		const is8ByteLengthBinArray = binArray.length >= 0 && binArray.length < (2 ** 8) - 1;
		const is16ByteLengthBinArray = binArray.length >= (2 ** 8) - 1  && binArray.length < (2 ** 16) - 1;
		const is32ByteLengthBinArray = binArray.length >= (2 ** 16) - 1  && binArray.length < (2 ** 32) - 1;

		if (is8ByteLengthBinArray) {
			this.append8ByteBinArray(binArray);
		} else if (is16ByteLengthBinArray) {
			this.append16ByteBinArray(binArray);
		} else if (is32ByteLengthBinArray) {
			this.append32ByteBinArray(binArray);
		}
	}

	appendBool(bool) {
		if (bool) this.appendByte(TypeIdentifiers.trueBool);
		else this.appendByte(TypeIdentifiers.falseBool);
	}

	increaseByteArraySize() {
		const oldArray = this.byteArray; 

		const newLength = oldArray.length * 2;
		const newArray = new Uint8Array(newLength);

		newArray.set(oldArray);

		this.byteArray = newArray;
	}

	setByteAtCurrentIndex(byte) {
		this.byteArray[this.index] = byte;
		this.index++;
	}

	appendByte(byte) {
		const byteArraySpaceFull = this.byteArray.length - 1 === this.index
		if (byteArraySpaceFull) {
			this.increaseByteArraySize();
		};

		this.setByteAtCurrentIndex(byte);
	}

	appendBytes(bytes) {
		bytes.forEach((byte) => {
			this.appendByte(byte);
		});
	}
}

class MsgpackDecoder {
}

const a = {
	name: 'Adam',
	age: 40,
	info: {
		birthyear: 1990,
		cum: ['cum', 1, -1111.999]
	}
};

console.log(new MsgpackEncoder().encode(a));

