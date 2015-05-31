const Clutter = imports.gi.Clutter;
const Gio = imports.gi.Gio;
const Lang = imports.lang;
const St = imports.gi.St;
const Pango = imports.gi.Pango;

const Hdate = imports.gi.LibHdateGlib.Hdate;
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Hdatef = Extension.imports.Hdatefun

function _sameDay(dateA, dateB) {
    return (dateA[0] == dateB[0] &&
            dateA[1] == dateB[1] &&
            dateA[2] == dateB[2]);
};

function _sameYear(dateA, dateB) {
    return (dateA[0] == dateB[0]);
};


function Calendar() {
    this._init();
};


Calendar.prototype = {
   
    // These are the labels that will be printed in the first box
    weekdayAbbr: ['א','ב','ג','ד','ה','ו','שבת'],
    _weekStart: 7,
        
    _init: function() {
        // Starting with today's Hebrew Date in Numbers.
        this._selectedDate = Hdate.new();
        this._selectedDate.set_longitude(34.77);
        this._selectedDate.set_latitude(32.07);
        this._selectedDate.set_tz(2);
        this._selectedDate.set_dst(0);  
        this._selectedDate.set_use_hebrew(true); // ATTN
        this._selectedDate.set_use_short_format(false);
        this._selectedDate.set_today(0,0,0);

        // And put it in YYYY-MM-DD format for selecting purposes.
        this._selectedDate = [ this._selectedDate.get_hyear(), this._selectedDate.get_hmonth(), this._selectedDate.get_hday() ];

        this.actor = new St.Table({ homogeneous: false,
                                    reactive: true });

        this.actor.connect('scroll-event', Lang.bind(this, this._onScroll));

        this._buildHeader ();
    },

    // Sets the calendar to show a specific date
    setDate: function(date) {
        if (!_sameDay(date, this._selectedDate)) {
            this._selectedDate = date;
            this._update();
        }
        else {
            this._update();
        }
    },

    _buildHeader: function() {
        this.actor.destroy_all_children();

        // Top line of the calendar '<| year, month |>'.
        // Shows year when scrolled to a different year.
        this._topBox = new St.BoxLayout();
        this.actor.add(this._topBox, { row: 0, col: 0, col_span: 8 });

        // RTL, so forward button goes back
        let forward = new St.Button({ style_class: 'calendar-change-month-back' });
        this._topBox.add(forward);
        forward.connect('clicked', Lang.bind(this, this._onNextMonthButtonClicked));

        this._monthLabel = new St.Label({style_class: 'calendar-month-label'});
        this._topBox.add(this._monthLabel, { expand: true, x_fill: false, x_align: St.Align.MIDDLE });

        // And back button goes forward.
        let back = new St.Button({ style_class: 'calendar-change-month-forward' });
        this._topBox.add(back);
        back.connect('clicked', Lang.bind(this, this._onPrevMonthButtonClicked));

        // Add weekday labels.
        for (let i = 1; i < 8; i++) {
            let label = new St.Label({ style_class: 'calendar-day-base calendar-day-heading calendar-heading',
                                       text: this.weekdayAbbr[i-1] });
            this.actor.add(label,
                           { row: 1,
                             col: 8 - i,
                             x_fill: false,
                             x_align: St.Align.MIDDLE });
        }

        // All the children after this are days, and get removed when we update the calendar
        this._firstDayIndex = this.actor.get_children().length;
    },

    _onScroll : function(actor, event) {
        switch (event.get_scroll_direction()) {
        case Clutter.ScrollDirection.UP:
        case Clutter.ScrollDirection.LEFT:
            this._onNextMonthButtonClicked();
            break;
        case Clutter.ScrollDirection.DOWN:
        case Clutter.ScrollDirection.RIGHT:
            this._onPrevMonthButtonClicked();
            break;
        }
    },

    _onPrevMonthButtonClicked: function() {
    //Hebrew calendar has several leap years
    //So we need to make sure we are showing Adar Alef and Adar Bet
    //when we have one.
    //No Leap Years = [1,2,3,4,5,6,7,8,9,10,11,12];
    //6 = Adar        
    //Leap Years = [1,2,3,4,5,13,14,7,8,9,10,11,12];
    //13= Adar Alef; 7= Adar Bet;
    //Strings come straight from HDate Lib.

    let newDate = this._selectedDate;
    let oldMonth = newDate[1];  
    if (Hdatef.fechas.isleap(newDate[0])) {
        switch (oldMonth) {
        case 1:
            newDate[1]=12;
            newDate[0]--;
            break;          
        case 7:
            newDate[1]=14;
            break;
        case 14:
            newDate[1]=13;
            break;
        case 13:
            newDate[1]=5;
            break;
        default:
            newDate[1]--;
            break;
        }
    }

    else {
        if (oldMonth == 1) {
            newDate[1]=12;
            newDate[0]--;
        }
        else {
            newDate[1]--;
        }
    }
        // Set the newDate before I leave.
        this.setDate(newDate);
    },

   _onNextMonthButtonClicked: function() {
    // This is the same principle as above.
    // Just going forward logic.

        let newDate = this._selectedDate;
        let oldMonth = newDate[1];  
        
        if (Hdatef.fechas.isleap(newDate[0])) {
            switch (oldMonth) {
            case 12:
                newDate[1]=1;
                newDate[0]++;
            break;          
            case 5:
                newDate[1]=13;
                break;
            case 13:
                newDate[1]=14;
                break;
            case 14:
                newDate[1]=7;
                break;
            default:
                newDate[1]++;
                break;
            }
        }

        else {
            if (oldMonth == 12) {
                newDate[1]=1;
                newDate[0]++;
             }
            else {
                newDate[1]++;
             }
        }

       this.setDate(newDate);
    },

    _update: function() {
        
        let now = Hdate.new();
        now.set_longitude(34.77);
        now.set_latitude(32.07);
        now.set_tz(2);
        now.set_dst(0); 
        now.set_use_hebrew(true); // ATTN
        now.set_use_short_format(false);
        now.set_today();
        now = [ now.get_hyear(), now.get_hmonth(), now.get_hday() ];
        
        // Init variable, then I'll show it in the month label.
        // If the year is the same, do not show.
        // But if it isn't, show month + year.
        let _strf = {};

        if (_sameYear(this._selectedDate, now)) {
        
            _strf = Hdatef.fechas.monthstring(this._selectedDate[1], this._selectedDate[0] );
            this._monthLabel.text = _strf[0] + '';

        }

        else {
           
            _strf = Hdatef.fechas.monthstring(this._selectedDate[1], this._selectedDate[0] );
            this._monthLabel.text = _strf[0] + ', ' + _strf[1];      

        }
        


        // Remove everything but the topBox and the weekday labels
        let children = this.actor.get_children();
        for (let i = this._firstDayIndex; i < children.length; i++) {
            children[i].destroy();
        }
        
        // I had to sort of rebuild this whole part which is inherited
        // from Gnome2.x Calendar Types.
        // My version is poorer and uses no hours nor any Date() JS functions.
        // It doesn't set day that doesn't belong to this month.
        // And as such needs more work. It is still a working solution.
        //
        // Set Update with new Hdate
        let beginDate = Hdate.new();
        beginDate.set_longitude(34.77);
        beginDate.set_latitude(32.07);
        beginDate.set_tz(2);
        beginDate.set_dst(0);  
        beginDate.set_use_hebrew(true);
        beginDate.set_use_short_format(false);
        //DD_MM_YY format to reset at the 1 of the month.
        beginDate.set_hdate(1 , this._selectedDate[1], this._selectedDate[0] );
        //HDate function instead of getDay();
        let dw2 = beginDate.get_day_of_the_week();
        
        // Rearrange beginDate to coincide with the rest of the code.
        beginDate = [ beginDate.get_hyear(), beginDate.get_hmonth(), 1 ]; 
        let daysToWeekStart = 7 - dw2;
        let daysinmonth = Hdatef.fechas.total_days_in_month( beginDate[0], beginDate[1] );
        
        // Start from row = 2 after daylabels and initialize working vars.
        let iter = [ beginDate[0], beginDate[1], beginDate[2] ];
        let row = 2;
        let p_iter;
        let savep;
        let _prsh = 0;
        let prsh = 0;
        
        while (true) {

            let p_iter = [ iter[0], iter[1], iter[2] ];
            let dw3 = Hdatef.fechas.dayweek( iter[0], iter[1], iter[2] );
            let checkholidays = Hdatef.fechas.holyday( p_iter[0],p_iter[1],p_iter[2] );
            
            // String to show date is in 'showday'.
            let showday = Hdatef.fechas.daystring(p_iter[2]);
            let button = new St.Button({ label: showday });
            
            // Setdate if presses button
            button.connect('clicked', Lang.bind(this, function() {
                this.setDate(p_iter);
            }));


            // Begin class styling according to position.
            // Needs work with stylesheet.css
            // 'dw3' is day of the week
            // 7=Shabbat
            let styleClass = 'calendar-day-base calendar-day calendar-regular';
            if (dw3==7) {
                            styleClass += ' calendar-nonwork-day';
                            prsh = 1;
            }
            else styleClass += ' calendar-work-day'
            
            //if ((p_iter[2]+1) == daysinmonth) prsh = 1;
            //if (((p_iter[2]+1) == daysinmonth) && (dw3 < 7)) prsh = 1;
            
            if (checkholidays[0] !== null) styleClass += ' calendar-holiday';

            if (_sameDay(now, p_iter)) styleClass += ' calendar-today';
            else 
                if (p_iter[1] !== this._selectedDate[1])
                styleClass += ' calendar-other-month-day';

            // Active buttons when pressed.
            if (_sameDay(this._selectedDate, p_iter))
                button.add_style_pseudo_class('active');
            
            // define class
            button.style_class = styleClass;
            
            // Calculate position (7 - Day of the week).
            // If I'm in Shabbat, go down one row.
            let cols = 8 - dw3;
            if (prsh == 1) {
            
                                let parasha = Hdatef.fechas.parsha(iter[0], iter[1], iter[2]);
                                let textp;
                                if (parasha) textp = parasha[0];
                                else if (checkholidays) textp = checkholidays[0];
                                let label8 = new St.Label({ text: textp });
                                label8.style_class = "calendar-parsha";
                                this.actor.add(label8, { row: row, col: 0 } );
                                _prsh++;
                                prsh = 0;
            }
            
            this.actor.add(button, { row: row, col: cols } );
            if (cols == 1) row++;
            
            // Add one day.
            let oldd = [ iter[0], iter[1], iter[2] ];
            iter[2]++;
            if (p_iter[2] == daysinmonth) break;
            
        }
        
        // Print last one -- none of this would be necessary if the calendar
        // engine I have would be great, but I don't have the skills to
        // to pull it off without great effort (im not a developer), so this is the workaround.
        /*
        if ((_prsh == 4)) { // || (_prsh == 5)) {
        
                         parasha = Hdatef.fechas.parsha(iter[0], iter[1], iter[2]);
                         if (parasha) textp = parasha[0];
                         else if (checkholidays) textp = checkholidays[0];
                         label8 = new St.Label({ text: textp });
                         label8.style_class = "calendar-parsha";
                         if ((_prsh == 5) && (dw3 !== 7)) {
                                this.actor.add(label8, { row: 7, col: 0 } );
                                ++row;
                         }
                         this.actor.add(label8, { row: 6, col: 0 } );
                        _prsh = 0;
        } */

        // Show box with Gregorian Date
        let g_selectedDate = Hdatef.fechas.hdatetogreg ( this._selectedDate[0], this._selectedDate[1], this._selectedDate[2] );

        let _datesBox_g = new St.BoxLayout();
        this.actor.add(_datesBox_g, { row: ++row, col: 0, col_span: 7 });
        let labelg = new St.Label({ text: g_selectedDate[2] + '/' + g_selectedDate[1] + '/' + g_selectedDate[0], style_class: 'calendar-month-label' });
            _datesBox_g.add(labelg, { expand: true, x_fill: false, x_align: St.Align.MIDDLE });

        // Eventbox for selecteddate
        let checkholidays = Hdatef.fechas.holyday( this._selectedDate[0], this._selectedDate[1], this._selectedDate[2] );
        if (checkholidays[0] !== null) {
            let _eventBox = new St.BoxLayout();
            this.actor.add(_eventBox, { row: ++row, col: 0, col_span: 7 });
            let bottomLabel = new St.Label({ text: checkholidays[0] + "", style_class: 'calendar-month-label text-holiday' });
            _eventBox.add(bottomLabel, { expand: true, x_fill: false, x_align: St.Align.MIDDLE });
        }

    }

}
