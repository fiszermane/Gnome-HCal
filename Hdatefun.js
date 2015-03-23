/****************** IMPORTS AND DEFS ************************/ 

// Bring HDate Glib
const Hdate = imports.gi.LibHdateGlib.Hdate;
// And Glib for testing purposes.
//const GLib = imports.gi.GLib;
var fechas = { };

/***********************************************************/

/************** SOME VALA FUNCTIONS REMINDER ***************/ 
/* Best go to source code of hdate-glib0.5 by Yaacov Zamir

    get_int_string( get_hday() );
    get_hebrew_month_string( get_hmonth() );
    get_int_string( get_hyear() );
    get_day_of_the_week
    get_size_of_year

/**********************************************************/

/*************** DEFINE WORKING Hdate Object **************/

    var tempss = Hdate.new();
    tempss.set_longitude(34.77);
    tempss.set_latitude(32.07);
    tempss.set_tz(2);
    tempss.set_dst(0);

/*********************************************************/

fechas.hdatetogreg = function(heb_year, heb_month, heb_day)
{
    tempss.set_use_hebrew(false);
    tempss.set_use_short_format(false);
    tempss.set_hdate(heb_day,heb_month,heb_year);
    let greg_year = tempss.get_gyear();
    let greg_month = tempss.get_gmonth();
    let greg_day = tempss.get_gday();
    return [greg_year, greg_month, greg_day];
};

fechas.gregtohdate = function(greg_year, greg_month, greg_day, strs)
{
    tempss.set_use_hebrew(true);
    tempss.set_use_short_format(false);
    tempss.set_gdate(greg_day, greg_month, greg_year);
    let heb_year = tempss.get_hyear();
    let heb_month = tempss.get_hmonth();
    let heb_day = tempss.get_hday();

    if (strs == false) { 
        return [heb_year, heb_month, heb_day];
    }
    else {
        return [ tempss.get_int_string( heb_day ), tempss.get_hebrew_month_string ( heb_month ), tempss.get_int_string( heb_year)];
    }

};


fechas.monthstring = function(month, year)
{   
    tempss.set_use_hebrew(true);
    tempss.set_use_short_format(false);
    tempss.set_hdate(1, month, year);
    let heb_year = tempss.get_hyear();
    let heb_month = tempss.get_hmonth();
    return [ tempss.get_hebrew_month_string(heb_month), tempss.get_int_string(heb_year) ];
};


fechas.daystring = function(day)
{   
    tempss.set_use_hebrew(true);
    tempss.set_use_short_format(false);
    // I really don't like how the ' in the single date digits
    // is visualized in the Gnome Calendar.
    var x = tempss.get_int_string( day );
    var res = x.replace("'", "");
    return (res);
};

fechas.isleap = function(year)
{
    let result = (7 * year) + 1;
    result = result % 19;
    if (result < 7) return true;
    else return false;
};

fechas.dayweek = function(year, month, day)
{
    tempss.set_hdate(day, month, year);
    return ( tempss.get_day_of_the_week() );
};

fechas.total_days_in_month = function(year, month)
{
    tempss.set_use_hebrew(true);
    tempss.set_use_short_format(false);
    //I start from 27 days. No month has 27, even 28.
    //More efficient would be 28 but I like the number.
    let day = 27;
    let temporal;   
    do {
        //This is even clumsier than the rest of the coding.
        //But I found no straight function to get total days in a single Heb Month
        //If I increment the HDay until false, it keeps going and no Error comes if its
        //not related to the month. Example: trying to setup 35 of Nisan with .set_hdate()
        //doesnt return "Error" but it keeps setting the date through Julian Date functions
        //in the library and it manages to get the real Gregorian Date updated and working.
        // Solution: I put a Heb Date, get the Greg Date and put again a Greg Date to see
        // when the Heb Date changes and then track when the Heb Month changes.

        temporal = tempss.set_hdate(day, month, year);
        let a_d = tempss.get_gday();
        let a_m = tempss.get_gmonth();
        let a_y = tempss.get_gyear();
        let temporal2 = tempss.set_gdate(a_d,a_m,a_y);
        var hebday = ['',''];
        var hebmon = ['',''];
        hebday[0] = tempss.get_hday();
        hebmon[0] = tempss.get_hmonth();
        let temporal3 = tempss.set_gdate(a_d+1,a_m,a_y);
        hebday[1] = tempss.get_hday();
        hebmon[1] = tempss.get_hmonth();
        //if (hebmon[0] !== hebmon[1]) break;
        day++;
        
    } while (hebmon[0] == hebmon[1]);

    return (hebday[0]);
};

fechas.holyday = function (hyear, hmonth, hday)
{

    tempss.set_use_hebrew(true);
    tempss.set_use_short_format(false);
    tempss.set_hdate(hday, hmonth, hyear);
    var holydaytype = tempss.get_holyday();
    var holydaystring = tempss.get_holyday_string(holydaytype);
    return [ holydaystring, holydaytype ];

}

fechas.parsha = function (hyear, hmonth, hday)
{

    tempss.set_use_hebrew(true);
    tempss.set_use_short_format(false);
    tempss.set_hdate(hday, hmonth, hyear);
    var portion_nbr = null;
    var str_portion = null;
    let portion = tempss.get_parasha();
    // if shabbat then its printing so fill and leave.
    if (portion != 0) {
        portion_nbr = tempss.get_parasha();
        str_portion = tempss.get_parasha_string(portion_nbr);
    }
    else {  
        let dia;
        do {    
            tempss.set_hdate(hday, hmonth, hyear);
            dia = tempss.get_day_of_the_week();
            portion_nbr = tempss.get_parasha();
            str_portion = tempss.get_parasha_string(portion_nbr);
            hday++;
        } while (dia !== 7);
    }

    return [ str_portion, portion_nbr ];

}
