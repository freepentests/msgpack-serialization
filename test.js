import {
	MsgpackEncoder,
	MsgpackDecoder
} from './index.js';

const arr = new Array(266).fill(5);
arr[0] = 'aaalol';
arr[2] = 'blmsm';
arr[3] = new Array(266).fill(6);
console.log(new MsgpackDecoder().decode(new MsgpackEncoder().encode(arr)));

