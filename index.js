import TypeIdentifiers from './Modules/TypeIdentifiers.js';

export * from './Modules/MsgpackEncoder.js';
export * from './Modules/MsgpackDecoder.js';

// I know a lot of this code is poor quality, but this is a work in progress, and I will be refactoring it; at the moment, I'm just focusing on getting something that works

// isFloat polyfill
if (!Number.prototype.isFloat) {
	Number.prototype.isFloat = function() {
		return this.valueOf() % 1 !== 0;
	}
}

