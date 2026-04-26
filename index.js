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
				if (data === null) this.appendNull();
				break;
		}

		return this.byteArray.slice(0, this.index);
	}

	appendNull() {
		this.appendByte(0xc0);
	}

	appendString(string) {
		const isFixStr = string.length > 0 && string.length < 32;
		const is8ByteLengthStr = string.length >= 32 && string.length < (2 ** 8) - 1;
		const is16ByteLengthStr = string.length >= (2 ** 8) - 1 && string.length < (2 ** 16) - 1;
		const is32ByteLengthStr = string.length >= (2 ** 16) - 1 && string.length < (2 ** 32) - 1;

		if (isFixStr) {
			this.appendByte(0xa0 + string.length);

			const encodedStringData = new TextEncoder().encode(string);
			this.appendBytes(encodedStringData);

		} else if (is8ByteLengthStr) {
			this.appendBytes([0xd9, string.length]);

			const encodedStringData = new TextEncoder().encode(string);
			this.appendBytes(encodedStringData);

		} else if (is16ByteLengthStr) {
			this.appendByte(0xda);

			const buffer = new ArrayBuffer(2);
			const dataView = new DataView(buffer);
			dataView.setUint16(0, string.length);
			const encodedStringLength = new Uint8Array(buffer);

			this.appendBytes(encodedStringLength);
			const encodedStringData = new TextEncoder().encode(string);

			this.appendBytes(encodedStringData);
		} else if (is32ByteLengthStr) {
			this.appendByte(0xdb);

			const buffer = new ArrayBuffer(4);
			const dataView = new DataView(buffer);
			dataView.setUint32(0, string.length);
			const encodedStringLength = new Uint8Array(buffer);

			this.appendBytes(encodedStringLength);
			const encodedStringData = new TextEncoder().encode(string);

			this.appendBytes(encodedStringData);
		}
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
			this.appendByte(number);
			return;
		}

		if (is8BitUnsignedInt) {
			this.appendByte(0xcc);
			this.appendByte(number);
			return;
		}

		if (is16BitUnsignedInt) {
			this.appendByte(0xcd);

			const buffer = new ArrayBuffer(2);
			const dataView = new DataView(buffer);
			dataView.setUint16(0, number);
			const encodedByteArray = new Uint8Array(buffer);

			this.appendBytes(encodedByteArray);
			return;
		}

		if (is32BitUnsignedInt) {
			this.appendByte(0xce);

			const buffer = new ArrayBuffer(4);
			const dataView = new DataView(buffer);
			dataView.setUint32(0, number);
			const encodedByteArray = new Uint8Array(buffer);

			this.appendBytes(encodedByteArray);
			return;
		}
		
		if (is64BitUnsignedInt) {
			this.appendByte(0xcf);

			const buffer = new ArrayBuffer(8);
			const dataView = new DataView(buffer);
			dataView.setUint64(0, number);
			const encodedByteArray = new Uint8Array(buffer);

			this.appendBytes(encodedByteArray);
			return;
		}

		if (is8BitSignedInt) {
			this.appendByte(0xd0);
			this.appendByte(number);
			return;
		}

		if (is16BitSignedInt) {
			this.appendByte(0xd1);

			const buffer = new ArrayBuffer(2);
			const dataView = new DataView(buffer);
			dataView.setInt16(0, number);
			const encodedByteArray = new Uint8Array(buffer);

			this.appendBytes(encodedByteArray);
			return;
		}

		if (is32BitSignedInt) {
			this.appendByte(0xd2);

			const buffer = new ArrayBuffer(4);
			const dataView = new DataView(buffer);
			dataView.setInt32(0, number);
			const encodedByteArray = new Uint8Array(buffer);

			this.appendBytes(encodedByteArray);
			return;
		}
		
		if (is64BitSignedInt) {
			this.appendByte(0xd3);

			const buffer = new ArrayBuffer(8);
			const dataView = new DataView(buffer);
			dataView.setInt64(0, number);
			const encodedByteArray = new Uint8Array(buffer);

			this.appendBytes(encodedByteArray);
			return;
		}
	}

	appendFloat(number) {
		this.appendByte(0xcb);

		const buffer = new ArrayBuffer(8);
		const dataView = new DataView(buffer);
		dataView.setFloat64(0, number);
		const encodedByteArray = new Uint8Array(buffer);

		this.appendBytes(encodedByteArray);

	}

	appendNumber(number) {
		if (number.isFloat()) {
			this.appendFloat(number);
		} else {
			this.appendInt(number);
		}

	}

	appendBool(bool) {
		if (bool) this.appendByte(0xc2);
		else this.appendByte(0xc3);
	}

	appendByte(byte) {
		if (this.byteArray.length - 1 === this.index) {
			const oldArray = this.byteArray; 

			const newLength = oldArray.length * 2;
			const newArray = new Uint8Array(newLength);

			newArray.set(oldArray);

			this.byteArray = newArray;
		};

		this.byteArray[this.index] = byte;
		this.index++;
	}

	appendBytes(bytes) {
		bytes.forEach((byte) => {
			this.appendByte(byte);
		});
	}
}

console.log(new MsgpackEncoder().encode(null));
console.log(new MsgpackEncoder().encode(true));
console.log(new MsgpackEncoder().encode(false));
console.log(new MsgpackEncoder().encode(12));
console.log(new MsgpackEncoder().encode(-12));
console.log(new MsgpackEncoder().encode(1111111));
console.log(new MsgpackEncoder().encode(-1111111));
console.log(new MsgpackEncoder().encode(10.1234));
console.log(new MsgpackEncoder().encode(255));
console.log(new MsgpackEncoder().encode(10000000000.1234));
console.log(new MsgpackEncoder().encode(214748324.128));
console.log(new MsgpackEncoder().encode(-214748324.128));
console.log(new MsgpackEncoder().encode("test"));

