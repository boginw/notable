export default class TimeAgo {

	private o: object = {
		second: 1000,
		minute: 60 * 1000,
		hour: 60 * 1000 * 60,
		day: 24 * 60 * 1000 * 60,
		week: 7 * 24 * 60 * 1000 * 60,
		month: 30 * 24 * 60 * 1000 * 60,
		year: 365 * 24 * 60 * 1000 * 60
	};

	public ago(nd);
	public ago(nd, s?) {
		let r = Math.round,
			pl = function (v, n) {
				return (s === undefined) ? n + ' ' + v + (n > 1 ? 's' : '') + ' ago' : n + v.substring(0, 1);
			},
			ts = Date.now() - new Date(nd).getTime(),
			ii,
			i;
		for (i in this.o) {
			if (r(ts) < this.o[i]) {
				return pl(ii || 'm', r(ts / (this.o[ii] || 1)));
			}
			ii = i;
		}
		return pl(i, r(ts / this.o[i]));
	}

	public today() {
		let now = new Date();
		let Weekday = new Array(
			"Sunday",
			"Monday",
			"Tuesday",
			"Wednesday",
			"Thursday",
			"Friday",
			"Saturday"
		);
		let Month = new Array(
			"January",
			"February",
			"March",
			"April",
			"May",
			"June",
			"July",
			"August",
			"September",
			"October",
			"November",
			"December"
		);
		return Weekday[now.getDay()] + ", " + Month[now.getMonth()] + " " + now.getDate() + ", " + now.getFullYear();
	}

	/*timefriendly = function(s) {
		let t = s.match(/(\d).([a-z]*?)s?$/);
		return t[1] * eval(this.o[t[2]]);
	}*/

	public mintoread (text, altcmt, wpm) {
		let m = Math.round(text.split(' ').length / (wpm || 200));
		return (m || '< 1') + (altcmt || ' min to read');
	}
}