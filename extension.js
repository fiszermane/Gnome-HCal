const St = imports.gi.St;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const MainLoop = imports.mainloop;
const Lang = imports.lang;
const MessageTray = imports.ui.messageTray;
const Pango = imports.gi.Pango;
const Clutter = imports.gi.Clutter;
const Shell = imports.gi.Shell;

const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();
const Calendar = Extension.imports.calendar;
const Hdatef = Extension.imports.Hdatefun
const Hdate = imports.gi.LibHdateGlib.Hdate;

const GnomeHCal = new Lang.Class({
    Name: 'GnomeHCal.GnomeHCal',
    Extends: PanelMenu.Button,

    _init: function() {
        this.parent(0.0);
        this.label = new St.Label({y_expand: true,
                                   y_align: Clutter.ActorAlign.CENTER });
        this.actor.add_actor(this.label);
        
        this._today  = '';
        this.today = [3];
        
        let vbox = new St.BoxLayout({vertical: true});
        
        this._calendar = new Calendar.Calendar();
        vbox.add(this._calendar.actor, {x_fill: false,
                                        x_align: St.Align.MIDDLE })
        
        let popupMenuItem = new PopupMenu.PopupBaseMenuItem({hover: false});
        popupMenuItem.actor.add_child(vbox);
        this.menu.addMenuItem(popupMenuItem);
        
        this.menu.connect('open-state-changed', Lang.bind(this, function(menu, isOpen) {
            
            if (isOpen) {

                let now = Hdate.new();
                now.set_longitude(34.77);
                now.set_latitude(32.07);
                now.set_tz(2);
                now.set_dst(0); 
                now.set_use_hebrew(true); // ATTN
                now.set_use_short_format(false);
                now.set_today(0,0,0);
                now = [ now.get_hyear(), now.get_hmonth(), now.get_hday() ];                
                this._calendar.setDate(now);
            }

        }));
    },

    _updateDate: function() {
        let _date = Hdate.new();
        _date.set_longitude(34.77);
        _date.set_latitude(32.07);
        _date.set_tz(2);
        _date.set_dst(0);  
        _date.set_use_hebrew(true);
        _date.set_use_short_format(false);
        _date.set_today(0,0,0);
        let label_string = _date.get_int_string( _date.get_hday() );
        label_string += " \u05D1" + _date.get_hebrew_month_string( _date.get_hmonth() );
        label_string += " " + _date.get_int_string( _date.get_hyear() );
        
        // check for holiday
        let holiday = _date.get_holyday();
        if (holiday != 0) label_string += ", " + _date.get_holyday_string( holyday );
        _date = [ _date.get_hyear(), _date.get_hmonth(), _date.get_hday() ];
        
        // if today is "today" just return, don't change anything
        if(this._today == _date[2]) return true;
        
        // set today as "today"
        this._today = _date[2];
        _date = _date[0] + ' ' + _date[1] + ' ' + _date[2];

        this.label.set_text(label_string);
        return true;
    }
});

let _indicator;
let _timer;

function init(metadata) {
};

function enable() {
  _indicator = new GnomeHCal;
  Main.panel.addToStatusArea('GnomeHCal', _indicator);
  _indicator._updateDate();
  _timer = MainLoop.timeout_add(60000, Lang.bind(_indicator, _indicator._updateDate));
};

function disable() {
  _indicator.destroy();
  MainLoop.source_remove(_timer);
};
