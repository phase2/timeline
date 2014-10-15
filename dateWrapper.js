// IE8 doesn't have trim by default, we need it
if(typeof String.prototype.trim !== 'function') {
  String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, ''); 
  }
}

/**
 * A basic date wrapper library to ensure consistant handling of dates
 * and add ability to parse CE / BCE / AD / BC dates.
 */

var DateWrapper = function(date) {
  this.original = date;
  if (date instanceof DateWrapper) {
    this.date = date.date;
  } else if (date != null) {
    this.date = DateWrapper.parse(date);
  } else {
    this.date = NaN;
  }
}

DateWrapper.days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
DateWrapper.months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
DateWrapper.daysAbbr = ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat'];
DateWrapper.monthAbbr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

DateWrapper.parse = function(date) {
  date = DateWrapper.addComma(date);
  date = DateWrapper.addYear(date);
  date = DateWrapper.convertCE(date);

  return DateWrapper.checkDate(date);
};

DateWrapper.checkDate = function(date) {
  if (date instanceof Date && !isNaN(date)) { return date; }

  var parsed = new Date(date);
  if (parsed !== false && !isNaN(parsed)) {
    return parsed;
  } else if (parsed = Date.parse(parsed)) {
    return new Date(parsed);
  } else if (isFinite(date) && (parsed = new Date('January 1, ' + date))) {
    return parsed;
  }
  return false;
};

DateWrapper.addComma = function(date) {
  if (date.replace) {
    var mons = DateWrapper.months.concat(DateWrapper.monthAbbr).join('|');
    return date.replace(new RegExp('(' + mons + '),? ([0-9]{4})', 'i'), '$1 1, $2');
  }
  return date;
};

DateWrapper.addYear = function(date) {
  if (typeof(date.match) != 'function') { return date; }

  var matches, newDate = date,
      monthReg = '(' + DateWrapper.months.concat(DateWrapper.monthAbbr).join('|') + ')',
      dayReg = '([0-9]{1,2})',
      timeReg = 'T?(([0-9]{1,2}:[0-9]{2}) ?(am|pm)?( [A-Z]{3})?)',
      regexForward = new RegExp('^(' + monthReg + ' ?(' + dayReg + ')?),? ?([0-9]{1,4})? ?(' + timeReg + ')?$'),
      regexReverse = new RegExp('^((' + dayReg + ')? ?' + monthReg + '),? ?([0-9]{1,4})? ?(' + timeReg + ')?$'),
      year = (new Date()).getUTCFullYear(),
      pad = function(num, count) {
        while((''+num).length < count) {
          num = '0' + '' + num;
        }
        return num;
      }

  if (matches = date.match(regexForward) || date.match(regexReverse)) {
    year = matches[5] ? pad(matches[5], 4) + ' CE' : year;
    newDate = matches[1] + ', ' + year + (matches[6] ? ' ' + matches[6] : '');
  }
  return newDate;
}

DateWrapper.convertCE = function(date) {
  if (typeof(date.match) != 'function') { return date; }
  var epRegex = /(A\.?D\.?|B\.?C\.?E\.?|B\.?C\.?|C\.?E\.?)/i,
      regex = /([0-9]{1,4}) ?(A\.?D\.?|B\.?C\.?E\.?|B\.?C\.?|C\.?E\.?)/i,
      era = date.match(regex),
      parsed = new Date(date.replace(regex, '2013'));

  if (!isNaN(parsed) && era) {
    if (era[2].match(/B\.?C\.?|B\.?C\.?E\.?/i)) {
      year = -era[1];
      this.isBCE = true;
    } else {
      year = +era[1];
    }
    parsed.setUTCFullYear(year);
    return parsed;
  }

  return date;
}

DateWrapper.prototype = {
  print : function(pattern, utc, bceFormat, ceFormat) {
    if (!this.date instanceof Date || isNaN(this.date)) { return NaN; }
    var curYear = this.date.getUTCFullYear(),
        isBCE = false,
        clone = new Date(this.valueOf());

    if (curYear < 0) {
      clone.setUTCFullYear(Math.abs(curYear));
      isBCE = true;
    }

    pattern = pattern || dateFormat.masks.mediumDate;
    bceFormat = bceFormat == null ? 'BCE' : bceFormat;
    ceFormat = ceFormat == null ? '' : ceFormat;

    pattern = pattern.replace('yyyy', 'yyyy \'' + (isBCE ? bceFormat : ceFormat) + '\'');
    var string = dateFormat(+clone, pattern, utc);

    return string.trim();
  },
  toString : function() {
    return this.print();
  },
  valueOf : function() {
    if (this.date instanceof Date) {
      return this.date.getTime();
    }
    return NaN;
  },
  getTime : function() {
    return this.valueOf();
  }
}