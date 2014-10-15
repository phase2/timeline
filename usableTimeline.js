(function($) {
  // Private helper functions
  /**
   * Bind a function to an object
   *
   * @param o - the object to bind to (will be 'this' in the context of the function)
   * @param f - the function to bind
   *
   * @return a new function which will execute f in the context of o when run
   */
  var bind = function(o, f){
    return function() { return f.apply(o, arguments); };
  };

  /**
   * A simple function to run a function when the current execution chain is completed.
   * This will NOT execute the function immediately.
   *
   * @param fn - the function to run later.
   *
   * @return null
   */
  var runAsync = function(fn) {
    setTimeout(fn, 1);
  }

  /**
   * Make a date return UTC time for math purposes
   *
   * @param date - the date to use, it will not be modified
   * @param (optional) offset to use, will use the timezone offset of date if no offset provided
   *
   * @return a new date object with the time set to the UTC equivalent of the date param
   */
  var makeUTC = function(date, offset) {
    var clone = new Date(+date),
        usedOffset = offset || clone.getTimezoneOffset();

    setUTCMinutes(clone, clone.getTimezoneOffset());
    return clone;
  };

  /**
   * Simple helper to update the minutes for a date
   *
   * @param date - the date to update
   * @param offset - the amount of time to subtract from the current minutes
   *
   * @return null
   */
  var setUTCMinutes = function(date, offset) {
    date.setUTCMinutes(date.getUTCMinutes() - offset);
  }

  /**
   * Take milliseconds and convert them to hours
   *
   * @param msecs - a number of milliseconds to convert to hours
   *
   * @return float or int - the number of hours in the milliseconds
   */
  var makeHours = function(msecs) {
    return msecs / 1000 / 60 / 60;
  };

  /**
   * Get the date of the the next unit from the start date
   *
   * @param start - the date to start from
   * @param unit - the unit to move forward by - [hours, ampm, days, weeks, months, years, tens, fifty, hundred, five hundred, thousand]
   *
   * @return A new date representing the next unit after the start
   */
  var findOffset = function(start, unit) {
    var clone = new Date(+start);

    if (unit != 'hours' && unit != 'ampm') {
      clone.setUTCHours(0, 0, 0, 0);
    }

    switch (unit) {
      case 'hours' :
        clone.setUTCHours(clone.getUTCHours() + 1, 0, 0);
        break;
      case 'ampm' :
        var hours = (clone.getUTCHours() < 12) ? 12 : 24;
        clone.setUTCHours(hours, 0, 0, 0);
        break;
      case 'days' :
        clone.setUTCHours(24, 0, 0, 0);
        break;
      case 'weeks' :
        var day = clone.getDay();
        clone.setUTCDate(clone.getUTCDate() + (7 - day));
        break;
      case 'months' :
        clone.setUTCMonth(clone.getUTCMonth() + 1, 1);
        break;
      case 'years' :
        clone.setUTCFullYear(clone.getUTCFullYear() + 1, 0, 1);
        break;
      case 'tens' :
        var year = Math.round(clone.getUTCFullYear()/10) * 10;
        clone.setUTCFullYear(year + 10, 0, 1);
        break;
      case 'fifty' :
        var year = Math.round((clone.getUTCFullYear() + 49)/50) * 50;
        clone.setUTCFullYear(year, 0, 1);
        break;
      case 'hundred' :
        var year = Math.round(clone.getUTCFullYear()/100) * 100;
        clone.setUTCFullYear(year + 100, 0, 1);
        break;
      case 'five hundred' :
        var year = Math.round((clone.getUTCFullYear() + 499)/500) * 500;
        clone.setUTCFullYear(year, 0, 1);
        break;
      case 'thousand' :
        var year = Math.round(clone.getUTCFullYear()/1000) * 1000;
        clone.setUTCFullYear(year + 1000, 0, 1);
        break;
    }

    return clone;
  };

  /**
   * @TODO: Documentation
   * @param yMax
   * @returns {{checkArea: Function, markArea: Function, getY: Function}}
   */

  var makeGrid = function(yMax) {
    var store = [],
        init = function(x) {
          store[x] = store[x] || [];
        },
        grid = {
          checkArea : function(xStart, yStart, xCells, yCells) {
            var x = xStart,
                xLen = xStart + xCells,
                yLen = yStart + yCells;

            while (x < xLen) {
              init(x);
              var y = yStart;
              while (y < yLen) {
                if (store[x][y]) {
                  return store[x][y];
                }
                y++
              }
              x++;
            }

            return 0;
          },
          markArea : function(xStart, yStart, xCells, yCells, marker) {
            var x = xStart,
                xLen = xStart + xCells,
                yLen = yStart + yCells;

            while (x < xLen) {
              var y = yStart;
              init(x);
              while (y < yLen) {
                store[x][y] ? store[x][y]++ : store[x][y] = 1;
                y++
              }
              x++;
            }
          },
          getY : function(start, xCount, yCount) {
            var y = 0,
                min = Infinity,
                best = 0,
                result = true;

            while (y + yCount < yMax && result) {
              result = grid.checkArea(start, y, xCount, yCount);

              if (result < min) {
                min = result;
                best = y;
              }

              y++;
            }

            return best;
          }
        };
    return grid;
  };

  /**
   * Make an element mousedraggable (i.e. Scroll by dragging with the mouse/touch)
   * Requires Hammer.js to be available for dragging on mobile devices
   *
   * @param element - the element to make draggable
   *
   * @return null
   */
  var makeDraggable = function(element) {
    if ($(element).hammer) {
      $(element).hammer({
        show_touches: false,
        drag_block_horizontal: true,
        drag_lock_to_axis: true,
        swipe: false
      }).on('drag', function(e) {
        var start = $(this).data('startLeft');
        if (!start) {
          start = this.scrollLeft;
          $(this).data('startLeft', start);
        }
        this.scrollLeft = start - e.gesture.deltaX;
        return false;
      }).on('release', function(e) {
        $(this).data('startLeft', false);
      }).mousedown(function (event) { return false });

      $('.center-marker', element.parent()).mousedown(function(e) {
        return false;
      });
    } else {
      dragFallback(element);
    }
  };

  /**
   *
   * @param element
   */

  var dragFallback = function(element) {
    $(element).mousedown(function (event) {
        $(this).data('down', true)
            .data('x', event.clientX)
            .data('scrollLeft', this.scrollLeft);
        return false;
      }).mouseup(function (event) {
        $(this).data('down', false);
      }).mouseout(function (event) {
        if (!$(this).has(event.toElement).length && $(event.toElement).not('.triangle').not('.active-line').not('.center-marker').length) {
          $(this).data('down', false);
        }
      }).mousemove(function (event) {
        if ($(this).data('down')) {
          this.scrollLeft = $(this).data('scrollLeft') + $(this).data('x') - event.clientX;
        }
      });
  };

  /**
   * Timeline class - creates a timeline
   *
   * @TODO: Document options
   *
   * @param element
   * @param points
   * @param options
   * @returns {boolean}
   * @constructor
   */
  window.Timeline = function(element, points, options) {
    this.container = $(element);

    if (!this.container) {
      return false;
    }

    this.opts = $.extend({
      minHour: 'auto',
      minPlotSpacing: 200,
      subPlots: true,
      ampm: true,
      useMonthAbbr: true,
      useDayAbbr: false,
      padding: 0.5,
      activationDist: 10,
      respond:true,
      bce: 'BCE',
      ce: 'CE',
      verticalOffset: 0,
      mouseWheelActivateTime: 500,
      onIndexChange: function(ind, slide) {}
    }, options);

    this.init(points);
  };

  window.Timeline.prototype = {
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    daysAbbr: ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat'],
    monthAbbr: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    units: ['hours', 'ampm', 'days', 'weeks', 'months', 'years', 'tens', 'fifty', 'hundred', 'five-hundred', 'thousand'],
    conversions: [1, 12, 2, 7, 4, 13, 10, 5, 2, 5, 2],
    /**
     * @TODO: Document
     * @param points
     */
    init: function(points) {
      this.container.addClass('timeline-container');

      this.container.prepend('<span class="center-marker"><span class="triangle"></span><em class="active-line"></em></span>');

      this.element = $('<div class="timeline-viewport"></div>').appendTo(this.container);
      this.wrapper = $('<div class="timeline-wrap"></div>').appendTo(this.element);

      this.placements = {};
      this.points = [];

      this.monthOpts = this.opts.useMonthAbbr ? this.monthAbbr : this.months;
      this.dayOpts = this.opts.useDayAbbr ? this.dayAbbr : this.days;

      this.hourRange = 100;

      if (points && points instanceof Array) {
        this.addPoints(points);
      }

      this.registerEvents();

      if (this.points.length) {
        this.scrollToPoint(0);
      }
    },
    /**
     * @TODO: Document
     * @param start
     * @param end
     */
    setRange: function(start, end) {
      start = start || this.startDate;
      end = end || this.endDate;

      this.startDate = new DateWrapper(start);
      this.endDate = new DateWrapper(end);

      this.start = this.startDate;
      this.end = this.endDate;
    },
    /**
     * @TODO: Document
     */
    registerEvents: function() {
      var width = this.element.width();

      if (this.opts.respond) {
        var resizing,
            that = this;
        $(window).resize(function(e) {
          clearTimeout(resizing);
          resizing = setTimeout(function() {
            that.refreshPoints();
          }, 250);
        });
      }

      if ($.fn.mousewheel) {
        var ref = this.element[0],
        timeline = $(this.element).add('.center-marker', this.container).unbind('mousewheel'),
        delayAmount = this.opts.mouseWheelActivateTime,
        timer;

        timeline.hover(function() {
          // Delay binding of mousewheel to prevent accidental capture
          timer = setTimeout(function() {
            timeline.bind('mousewheel',function(e, delta, deltaX, deltaY) {
              ref.scrollLeft -= delta * Math.abs(delta);
              e.preventDefault();
            });
          }, delayAmount);
        }, function() {
          // hover off
          clearTimeout(timer);
          timeline.unbind('mousewheel');
        });
      }

      makeDraggable(this.element);

      this.activateOnScroll();
    },
    /**
     * @TODO: Document
     */
    resizeHours: function() {
      this.hourRange = makeHours(this.end - this.start) || 1;
    },
    /**
     * @TODO: Document
     */
    calculateSize: function() {
      this.elSize = this.wrapper.width();
      var minHour = this.opts.minHour;
      if (minHour == 'auto') {
        minHour = this.calcMinHour();
      }

      this.pxPerHour = minHour;
      this.pad();
      this.resizeHours();

      var newSize = this.hourRange * minHour;
      if (newSize > this.elSize) {
        this.elSize = newSize;
        this.wrapper.css('width',  this.elSize + 'px');
      }
    },
    /**
     * @TODO: Document
     * @param point
     * @param norefresh
     */
    checkStartEnd: function(point, norefresh) {
      var changed = false;
      if (!this.start || isNaN(this.start.getTime())) {
        this.setRange(point.data('date'), point.data('toDate'));
        changed = true;
      } else if (point.data('date') < this.startDate) {
        this.setRange(point.data('date'));
        changed = true;
      } else if (point.data('toDate') > this.endDate) {
        this.setRange(null, point.data('toDate'));
        changed = true;
      } else {
        this.placePoint(point);
        if (!norefresh) {
          runAsync(bind(this, this.rebuildScrollCache));
        }
      }

      if (!norefresh) {
        this.resizeHours();
        this.refreshPoints();
      }
    },
    /**
     * @TODO: Document
     * @param removedIndex
     */
    updateStartEnd: function(removedIndex) {
      if (this.points.length) {
        this.startDate = this.points[0].data('date');
        this.endDate = this.points[this.points.length - 1].data('toDate');

        this.start = this.startDate;
        this.end = this.endDate;

        this.resizeHours();

        if (this.hourRange == 0) {
          this.wrapper.css('width', this.element.width() + 'px');
          this.hourRange = 100;
        }

        this.refreshPoints();
      } else {
        this.endDate = undefined;
        this.startDate = undefined;
        this.start = false;
        this.end = false;
        this.emptyPlots();
      }
    },
    /**
     * @TODO: Document
     */
    refreshPoints: function() {
      if (this.element.width() < 500) {
        this.refreshMobile();
      } else {
        this.element.removeClass('mobile');
        this.calculateSize();
        this.emptySpans();

        this.placements = {};

        var l = 0;
        while(l < this.points.length) {
          this.placePoint(this.points[l], true);
          l++;
        }

        this.scrollToPoint(this.currentIndex, false, false, true, true);

        runAsync(bind(this, this.updatePointTops));
        runAsync(bind(this, this.refreshPlots));
        runAsync(bind(this, this.rebuildScrollCache));
      }
    },
    /**
     * @TODO: Document
     */
    refreshMobile: function() {
      this.calculateSize();
      this.emptySpans();

      this.placements = {};
      this.element.addClass('mobile');
      var l = 0;
      while(l < this.points.length) {
        this.placePoint(this.points[l], true, true);
        l++;
      }

      this.scrollToPoint(this.currentIndex, false, false, true, true);
      this.refreshPlots(null, null, null, true);
      runAsync(bind(this, this.rebuildScrollCache));
    },
    /**
     * @TODO: Document
     * @param points
     */
    addPoints: function(points) {
      for(var ind in points) {
        this.addPoint(points[ind].date, points[ind].content, points[ind].toDate, points[ind].weight, true);
      }

      this.refreshPoints();
    },
    /**
     * @TODO: Document
     * @param date
     * @param content
     * @param toDate
     * @param weight
     * @param norefresh
     * @returns {*}
     */
    addPoint: function(date, content, toDate, weight, norefresh) {
      var pointDate = new DateWrapper(date),
          toDate = toDate ? new DateWrapper(toDate) : pointDate;

      //check for invalid dates
      if (isNaN(pointDate.getTime())) { return false; }
      if (isNaN(toDate.getTime())) { toDate = pointDate; }

      var dateLabel = pointDate.print(),
          point = $('<div class="timeline-point"></div>').append(content).appendTo(this.wrapper);

      point.data('date', pointDate);
      point.data('toDate', toDate);
      point.data('marker', $('<em class="timeline-point-line"></em>').insertBefore(point));

      var weight = (weight !== undefined) ? weight : 0;
      point.data('weight', weight);

      var ref = this;
      point.click(function() {
        ref.scrollToPoint($(this).data('pointIndex'), true, true);
      });

      this.points.push(point);
      this.points.sort(function(a,b){
        var dateSort = a.data('date') - b.data('date');
        if (dateSort !== 0) {
          return dateSort;
        } else {
          if (a.data('weight') !== undefined || b.data('weight') !== undefined) {
            return a.data('weight') - b.data('weight');
          }
          return 0;
        }
      });

      var l = this.points.length;
      while(l--) {
        this.points[l].data('pointIndex', l);
      }

      this.checkStartEnd(point, norefresh);

      return point;
    },
    /**
     * @TODO: Document
     * @param point
     * @param norefresh
     * @returns {*}
     */
    removePoint: function(point, norefresh) {
      var l = this.points.length;
      while(l--) {
        if (this.points[l] == point) {
          return this.removePointByIndex(l, norefresh);
        }
      }
      return false;
    },
    /**
     * @TODO: Document
     * @param removeIndex
     * @param norefresh
     * @returns {Array.<T>}
     */
    removePointByIndex: function(removeIndex, norefresh) {
      var removed = this.points.splice(removeIndex, 1);

      for (var ind in removed) {
        this.removeSpan(removed[ind]);
        if (removed[ind].data('marker')) { removed[ind].data('marker').remove(); }
        removed[ind].remove();
      }

      if (!norefresh) {
        this.updateStartEnd(removeIndex);
      }

      return removed;
    },
    /**
     * @TODO: Document
     * @param point
     * @param noTops
     * @param noAdd
     */
    placePoint: function(point, noTops, noAdd){
      var placement = makeHours(makeUTC(point.data('date')) - this.start),
          left = placement * this.pxPerHour;

      point.css('left', left);

      if (!noAdd) {
        point.data('marker').css('left', left);
      }

      this.addSpan(point, left);
      if (!noTops) {
        this.updatePointTops();
      }
    },
    /**
     * @TODO: Document
     */
    updatePointTops: function() {
      var points = this.points,
          xSize = 15,
          ySize = 15,
          grid = makeGrid(this.wrapper[0].offsetHeight / ySize - 1),
          l = 0;
          takeArea = function(point, l) {
            var start = Math.floor(parseFloat(point.css('left')) / xSize),
              xCount = Math.ceil((point[0].offsetWidth / 2) / xSize),
              yCount = Math.ceil((point[0].offsetHeight - 10) / ySize),
              y = grid.getY(start, xCount, yCount);

            grid.markArea(start, y, xCount, yCount);

            return y * ySize;
          }

      while (l < points.length) {
        var point = points[l];
        point.css('top', takeArea(point, l+1) + 'px');
        l++;
      }
    },
    /**
     * @TODO: Document
     */
    emptySpans: function() {
      if (!this.spansWrapper) {
        this.spansWrapper = $('<div class="ranges"></div>').appendTo(this.wrapper);
      } else {
        this.spansWrapper.empty();
      }
    },
    /**
     * @TODO: Document
     * @param point
     * @param left
     */
    addSpan: function(point, left) {
      var toDate = point.data('toDate'),
          width = '';
      if (toDate) {
        var diff = toDate - point.data('date');
        width = 'width:' + (makeHours(diff) * this.pxPerHour) + 'px';
      }

      var span = $('<span class="point-range" style="left:' + left + 'px; ' + width + '"><em class="start-point"></em></span>').appendTo(this.spansWrapper);
      point.data('span', span);
    },
    /**
     * @TODO: Document
     * @param point
     */
    removeSpan: function(point) {
      var span = point.data('span');
      if (span) {
        span.remove();
      }
    },
    /**
     * @TODO: Document
     * @param type
     */
    emptyPlots: function(type) {
      if (!this.plotsWrapper) {
        this.plotsWrapper = $('<div class="plots"></div>').appendTo(this.wrapper);
      } else if (type) {
        this.plotsWrapper.children('.' + type).remove();
      } else {
        this.plotsWrapper.empty();
      }

      if (!type || type == 'primary') {
        this.emptyLabels();
      }
    },
    /**
     * @TODO: Document
     * @param type
     * @param min
     * @param primary
     * @param noSub
     */
    refreshPlots: function(type, min, primary, noSub) {
      type = type || 'primary';
      min = min || this.opts.minPlotSpacing;
      this.emptyPlots(type);
      //determine what unit of time should show lines
      var unitSize = this.pxPerHour,
          unit = 0,
          hours = 1;

          var ref = this;
      function calcUnit() {
        while (unitSize < min && unit++ < ref.conversions.length) {
          unitSize *= ref.conversions[unit];
        }
      }

      // Give hours a fighting chance by making it only have to conform to min / 2
      // (since there are no subplots for hours)
      if (type != 'primary' || unitSize < min / 2) {
        calcUnit();
      }

      if (type == 'sub' && unit == primary) {
        return;
      } else if (!noSub && this.opts.subPlots && type != 'sub' && unit != 0) {
        var ref = this;

        runAsync(function() {
          ref.refreshPlots('sub', ref.opts.minPlotSpacing / 6, unit);
        });
      }

      this.placePlots(type, unit, Math.ceil(this.elSize / unitSize));
    },
    /**
     * @TODO: Document
     * @param type
     * @param unit
     * @param position
     * @param offset
     * @param index
     * @returns {string}
     */
    createPlot: function(type, unit, position, offset, index) {
      if (type == 'primary') {
        this.labelPlot(unit, Math.round(offset), position, index);
      }

      return '<em class="plot ' + type + ' ' + unit + '" style="left:' + position + 'px;"></em>';
    },
    /**
     * @TODO: Document
     * @param type
     * @param unitInd
     * @param totalUnits
     */
    placePlots: function(type, unitInd, totalUnits) {
      var count = 0,
          start = this.start,
          position = 0,
          unit = this.units[unitInd],
          plots = '';

      while (++count < totalUnits) {
        start = findOffset(start, unit);

        var milliOffset = start - this.start;
        position = makeHours(milliOffset) * this.pxPerHour;

        if (position > this.elSize) {
          break;
        }
        plots += this.createPlot(type, unit, position, milliOffset, count);
      }

      this.plotsWrapper.append(plots);
      var ref = this;
    },
    /**
     * @TODO: Document
     */
    emptyLabels: function() {
      if (!this.labelsWrapper) {
        this.labelsWrapper = $('<div class="labels"></div>').insertAfter(this.wrapper);
      } else {
        this.labelsWrapper.empty();
      }
    },
    /**
     * @TODO: Document
     * @param unit
     * @param millis
     * @param position
     * @param ind
     */
    labelPlot: function(unit, millis, position, ind){
      var text = '',
          width = this.opts.minPlotSpacing;
          date = new DateWrapper(+this.start + millis);

      switch(unit) {
        case 'hours':
          text = date.print('h TT', true);
          break;
        case 'ampm':
          if (date.date.getUTCHours() === 0) {
            text = date.print('mmm dd', true);
            if (ind % 5 == 0) {
              text += ', ' + date.print('yyyy', true);
            }
          } else {
            text = date.print('h TT', true);
          }
          break;
        case 'days':
        case 'weeks':
        case 'months':
          text = date.print('mmm dd', true);
          if (ind % 3 == 0) {
            text += ', ' + date.print('yyyy', true);
          }
          break;
        case 'years':
        case 'tens':
        case 'fifty':
        case 'hundred':
          text = date.print('yyyy', true);
          break;
        case 'five hundred':
        case 'thousand':
          text = date.print('yyyy', true, this.opts.bce, this.opts.ce);
          break;
      }

      position -= width / 2;
      this.labelsWrapper.append('<p class="label" class="' + unit + '" style="left:' + position + 'px; width:' + width + 'px;">' + text + '</p>');
    },
    /**
     * @TODO: Document
     */
    pad: function() {
      var padding = (this.opts.padding * this.element.width()) / this.pxPerHour;
      padding = padding * 1000 * 60 * 60;
      if (padding) {
        this.start = new DateWrapper(+makeUTC(this.startDate) - padding);
        this.end = new DateWrapper(+makeUTC(this.endDate) + padding);
      }
    },
    /**
     * Change the activate timeline point in the slider.
     *
     * @param The position of the timeline point.
     * @param animate (optional) - Should the scroll be animated?
     * @param trigger (optional) - Should the scroll trigger the scroll event?
     * @param noactivate (optional) - Should the scroll set the active state for the timeline point?
     * @param noClear (optional) - If noactivate is set, should the timeline component update the active state of the parent container?
     */
    scrollToPoint: function(ind, animate, trigger, noactivate, noClear) {
      if (!this.points[ind]) {
        return;
      }
      var point = this.points[ind],
          elSize = this.element.outerWidth(),
          left = point.position().left - (0.5 * elSize);

      this.scrolling = true;
      //finish the scrolling
      var finish = function(self) {
        if (noactivate) {
          !noClear && self.clearActive();
          this.currentIndex = ind;
        } else {
          self.activate(point, ind, !trigger);
        }
        setTimeout(function() {
          self.scrolling = false;
        }, 1);
      };

      if (animate) {
        var curr = this.element.scrollLeft();
        this.element.stop(true).animate({scrollLeft: left}, 750 - 750 / (left - curr), bind(this, function() {
            if (trigger) {
              this.scrolling = false;
            }
            finish(this);
          })
        );
      } else {
        this.element.scrollLeft(left);
        finish(this);
      }
    },
    /**
     * Removes active class from wrapper div.
     *
     * @TODO: Make private method.
     */
    clearActive: function() {
      $('.active', this.wrapper).removeClass('active');
    },
    /**
     * @TODO: Document
     * @param point
     * @param ind
     * @param noEvent
     */
    activate: function(point, ind, noEvent) {
      this.clearActive();
      this.currentIndex = ind;

      $(point).add(point.data('marker')).add(point.data('span')).addClass('active');

      if (!noEvent && !this.scrolling && typeof this.opts.onIndexChange == 'function') {
        this.opts.onIndexChange(ind, point)
      }
    },
    /**
     * @TODO: Document
     */
    rebuildScrollCache: function() {
      this.scrollCache = [];

      var min = this.opts.activationDist,
          width = this.elSize,
          nextLeft = this.points[0] ? this.points[0].position().left : 0;

      for (var ind = 0; ind < this.points.length; ind++) {
        var point = this.points[ind],
            left = nextLeft,
            before = left - min,
            after = left + min,
            cacheItem = {
              'before' : before,
              'point' : point,
              'after' : after
            };

        this.scrollCache.push(cacheItem);

        if (ind + 1 < this.points.length) {
          var next = this.points[ind+1];

          nextLeft = next.position().left;

          if (nextLeft - min < after) {
            var diff = (nextLeft - left) / 2;
            cacheItem.after = left + diff;

            this.scrollCache.push({
              'before' : nextLeft - diff,
              'point' : next,
              'after' : nextLeft + min
            });
            ind += 1;
          }
        }
      }
    },
    /**
     * @TODO: Document
     */
    activateOnScroll: function() {
      this.rebuildScrollCache();
      var ref = this;
      $(this.element).scroll(function(e) {
        if (ref.scrolling) { return; }
        var direction = this.prevScroll ? this.scrollLeft - this.prevScroll : -1,
            center = this.scrollLeft + (0.5 * $(this).innerWidth()),
            pastRange = function(center, range, prev, dir, ind) {
              if (!prev || range.point.hasClass('active') || prev.point.hasClass('active')) {
                return false;
              }

              if (dir > 0 && prev.after < center && center < range.before) {
                ref.activate(prev.point, ind - 1);
                return true;
              } else if (dir < 0 && range.before > center && center > prev.after) {
                ref.activate(range.point, ind);
                return true;
              }
            },
            prev = false;

        //Force direction to be +/- 1
        direction = direction / Math.abs(direction);
        this.prevScroll = this.scrollLeft;
        for (var ind = 0; ind < ref.scrollCache.length; ind++) {
          var range = ref.scrollCache[ind];

          if (range.before < center && center < range.after) {
            ref.activate(range.point, ind);
            return;
          } else if (pastRange(center, range, prev, direction, ind)) {
            return
          }

          prev = range;
        }
      });
    },
    /**
     * @TODO: Document
     * @returns {number}
     */
    calcMinHour: function() {
      var len = this.points.length,
          l = len - 1,
          width = this.element.width(),
          milliPerHour = 1000 * 60 * 60,
          prev = +this.points[l].data('toDate'),
          max = 0,
          min = Infinity,
          dists = 0,
          mult = 5;

      while(l--) {
        var msecs = +this.points[l].data('toDate');
        var diff = (prev - msecs);
        //Ensure the difference is significant (60000µSeconds = 1 minute)
        if (diff > 60000) {
          dists += diff;
          max = Math.max(diff, max);
          min = Math.min(diff, min);
        } else {
          len--;
        }
        prev = msecs;
      }

      var avg = dists / (len || 1),
          range = (+this.endDate - +this.startDate) / milliPerHour || 1;

      if (avg < 1) {
        avg = range * milliPerHour;
      }

      if (avg > (20 * min) && min > 0 && min != Infinity) {
        avg = Math.exp((Math.log(avg) + Math.log(min)) / 2);
      }

      return (width) / (mult * avg) * milliPerHour;
    }
  }
})(jQuery);
