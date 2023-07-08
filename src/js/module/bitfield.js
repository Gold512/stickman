export class Bitfield {
	constructor(fields) {
		this.fields = {};

		for (var i = fields.length - 1; i >= 0; i--) {
			this.fields[fields[i]] = 1 << i;
		}
	}

	toJSON(b) {
		let result = {};
		for (let i in this.fields) {
			const c = this.fields[i];
			const s = b >= c;
			if (s) b -= c;
			result[i] = s;
		}

		return result;
	}

	toBits(j) {
		let result = 0;

		for (let i in j) {
			if (j[i]) result += this.fields[i];
		}

		return result;
	}
}
