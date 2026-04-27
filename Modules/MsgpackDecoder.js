import TypeIdentifiers from './TypeIdentifiers.js';

export class MsgpackDecoder {
	constructor() {
		this.index = 0;
	}

	decode(data) {
		const byteArray = new Uint8Array(data); // assuming that data is an arraybuffer or something that can be converted into a Uint8Array; I will be adding error checking later
		const typeIdentifier = new DataView(byteArray.buffer).getUint8(0); // first byte is type identifier

		const isFixStr = typeIdentifier >= TypeIdentifiers.fixStr && typeIdentifier <= TypeIdentifiers.fixStr + 31;
		const isFixInt = typeIdentifier >= (typeIdentifier - 255 - 1) && typeIdentifier <= 127

		if (isFixStr) {
			return this.decodeFixStr(data);
		} else if (isFixInt) {
			this.index++;
			return typeIdentifier;
		}

		switch (typeIdentifier) {
			// switch hell
			// but i'll fix it
			case TypeIdentifiers.trueBool: return true;
			case TypeIdentifiers.falseBool: return false;
			case TypeIdentifiers.nil: return null;
			case TypeIdentifiers.float64: return this.decodeFloat64(data);

			/*
			case TypeIdentifiers.fixMap: return this.decodeFixMap(data);
			case TypeIdentifiers.fixArray: return this.decodeFixArray(data);
			*/

			case TypeIdentifiers.var_8ByteLengthBinArray: return this.decode8ByteLengthBinArray(data);
			case TypeIdentifiers.var_16ByteLengthBinArray: return this.decode16ByteLengthBinArray(data);
			case TypeIdentifiers.var_32ByteLengthBinArray: return this.decode32ByteLengthBinArray(data);

			case TypeIdentifiers.var_8BitUnsignedInt: return this.decode8BitUnsignedInt(data);
			case TypeIdentifiers.var_16BitUnsignedInt: return this.decode16BitUnsignedInt(data);
			case TypeIdentifiers.var_32BitUnsignedInt: return this.decode32BitUnsignedInt(data);
			case TypeIdentifiers.var_64BitUnsignedInt: return this.decode64BitUnsignedInt(data);

			case TypeIdentifiers.var_8BitSignedInt: return this.decode8BitSignedInt(data);
			case TypeIdentifiers.var_16BitSignedInt: return this.decode16BitSignedInt(data);
			case TypeIdentifiers.var_32BitSignedInt: return this.decode32BitSignedInt(data);
			case TypeIdentifiers.var_64BitSignedInt: return this.decode64BitSignedInt(data);

			case TypeIdentifiers.var_8ByteLengthStr: return this.decode8ByteLengthStr(data);
			case TypeIdentifiers.var_16ByteLengthStr: return this.decode16ByteLengthStr(data);
			case TypeIdentifiers.var_32ByteLengthStr: return this.decode32ByteLengthStr(data);

			case TypeIdentifiers.var_16ByteLengthArray: return this.decode16ByteLengthArray(data);
			case TypeIdentifiers.var_32ByteLengthArray: return this.decode32ByteLengthArray(data);

			case TypeIdentifiers.var_16ByteMap: return this.decode16ByteMap(data);
			case TypeIdentifiers.var_32ByteMap: return this.decode32ByteMap(data);
		}
	}

	// a lot of repetition, but I will fix it

	decode8ByteLengthStr(data) {
		const stringLength = data[1];
		const string = new TextDecoder().decode(data.slice(2, stringlength + 2));

		return string;
	}

	decode16ByteLengthStr(data) {
		const stringLength = new DataView(data.buffer).getUint16(1);
		const string = new TextDecoder().decode(data.slice(3, stringLength + 3));

		return string;
	}

	decode32ByteLengthStr(data) {
		const stringLength = new DataView(data.buffer).getUint32(1);
		const string = new TextDecoder().decode(data.slice(5, stringLength + 5));

		return string;
	}

	decode8BitUnsignedInt(data) {
		return data[1];
	}

	decode16BitUnsignedInt(data) {
		return new DataView(data.buffer).getUint16(1);
	}

	decode32BitUnsignedInt(data) {
		return new DataView(data.buffer).getUint32(1);
	}

	decode64BitUnsignedInt(data) {
		return new DataView(data.buffer).getUint64(1);
	}

	decode8BitSignedInt(data) {
		return new DataView(data.buffer).getInt8(1);
	}

	decode16BitSignedInt(data) {
		return new DataView(data.buffer).getInt16(1);
	}

	decode32BitSignedInt(data) {
		return new DataView(data.buffer).getInt32(1);
	}

	decode64BitSignedInt(data) {
		return new DataView(data.buffer).getInt64(1);
	}

	decode8ByteLengthBinArray(data) {
		const binArrayLength = data[1];
		const binArray = data.slice(2, binArrayLength + 2);

		return binArray;
	}

	decode16ByteLengthBinArray(data) {
		const binArrayLength = new DataView(data.buffer).getUint16(1);
		const binArray = data.slice(3, binArrayLength + 3);

		return binArray;
	}

	decode32ByteLengthBinArray(data) {
		const binArrayLength = new DataView(data.buffer).getUint32(1);
		const binArray = data.slice(5, binArrayLength + 5);

		return binArray;
	}

	decodeFixStr(data) {
		const stringLength = data[0] - TypeIdentifiers.fixStr;
		const decodedString = new TextDecoder().decode(data.slice(1, stringLength + 1));

		this.index += decodedString.length;

		return decodedString;
	}

	decodeFloat64(data) {
		const dataView = new DataView(data.buffer);
		return dataView.getFloat64(1);
	}

	decode16ByteLengthArray(data) {
		let arrayLength = new DataView(data.buffer).getUint16(1);

		const array = [];
		this.index += 3;

		for (let i = 0; i < arrayLength; i++) {
			const arrayBytes = data.slice(this.index);
			const decodedArrayBytes = this.decode(arrayBytes);
			array.push(decodedArrayBytes);
		}

		return array;
	}
}

