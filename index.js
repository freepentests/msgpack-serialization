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

			case 'object':
				if (data === null) this.appendNull();
				break;
		}

		return this.byteArray.slice(0, this.index);
	}

	appendNull() {
		this.appendByte(0xc0);
	}

	appendInt(number) {
		const isUnsignedFixint = number > (2 ** 0) - 1 && number < (2 ** 7) - 1;
		const isSignedFixint = number > -(2 ** 5) - 1 && number < (2 ** 0) - 1;

		const is8BitUnsignedInt = number > (2 ** 0) - 1 && number < (2 ** 8) - 1;
		const is16BitUnsignedInt = number > (2 ** 8) - 1 && number < (2 ** 16) - 1;
		const is32BitUnsignedInt = number > (2 ** 16) - 1 && number < (2 ** 32) - 1;
		const is64BitUnsignedInt = number > (2 ** 32) - 1 && number < (2 ** 64) - 1;

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
	}

	appendFloat(number) {
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

