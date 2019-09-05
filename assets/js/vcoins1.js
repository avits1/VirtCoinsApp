
var coins_data = [];
var coin_more_data = {};
var more_info_cache = [];
var coins_chosen= [];
var coins_compare= [];

const MAX_COIN_IN_REPORT = 5;
var on_mark = false;

$(document).ready(function(){
    $(".home-msgs").hide(100);             
    $( function() {
        $( "#tabs" ).tabs({
            active: 0,
          });       
    } );
        
    if( localStorage.more_info_cache_ls ){
        more_info_cache = JSON.parse( localStorage.more_info_cache_ls);
    }
    getVirtCoins(); 
  
});


var apiListCoins = "https://api.coingecko.com/api/v3/coins/list";
var apiCoinMoreInfo = "https://api.coingecko.com/api/v3/coins/";
var apiCoinsCompare = "https://min-api.cryptocompare.com/data/pricemulti?fsyms=";

// Get 100 Virtual Coins
function getVirtCoins(){    
    $(".home-spinner").show(100);
    $.ajax({
        url:apiListCoins,
        type:"GET",
        data: {},
        success:function( result ){
            coins_data = result;
            showVirtCoins(100, false);
            $(".home-spinner").hide(500);
        },
        error:function( err ){
            console.log("Ajax getVirtCoins() return with Error:",err);
            $(".home-spinner").hide(500);
        }
    })
}

function showVirtCoins(numCoins, to_search, search_symbol) {
    $(".home-msgs").text("");
    $(".home-msgs").hide(200);
    $("#virt-coins-wrapper").html("");
    if (to_search) {
        search_symbol = search_symbol.toLowerCase();
        if (search_symbol.length < 3) {
            $(".home-msgs").text("search text is too short !");
            $(".home-msgs").show(500);
            return;
        }
    }
    $("#virt-coins-wrapper").append("<div class='row inner_vcoins'></div>");

    let printed = 0;
    let symbol_lower = "";
    $(coins_data).each(function(index,vcoin){
        if (printed >= numCoins) // loop virt. coins by numCoins
            return false;
        else if (to_search) {
            symbol_lower = vcoin.symbol.toLowerCase();
            if (!symbol_lower.includes(search_symbol)) { // symbol search failed
                return true; // continue
            }
        }

        printed++;    
        printVirtCoin(vcoin, index);
    });   

    // BS TOGGLE 3.3.4:
    $("[name='vcoin-toggle']").bootstrapToggle({    
        on: 'Add'
    }); 

    // mark ON for every coin added before
    for (let idx = 0 ; idx < coins_chosen.length ; idx++) {
        let added_id = coins_chosen[idx].vcoin_id;   
        on_mark = true;
        $(`div#vcoin_${added_id} .vcoin_toggle`).bootstrapToggle('on');            
        on_mark = false;
    }
    
}

function printVirtCoin(vcoin, vindex) {
        // wrap into BS Cards
        let vcoin_card = $(`<div id="vcoin_${vcoin.id}"></div>`);
        $(vcoin_card).addClass("card px-1"); 
        $(vcoin_card).addClass("col-xl-2"); 
        $(vcoin_card).addClass("col-lg-3"); 
        $(vcoin_card).addClass("col-md-4"); 
        $(vcoin_card).addClass("col-sm-4"); 
           
        $(vcoin_card).addClass("border-secondary");
        $(vcoin_card).addClass("vcoin-card"); 

        let vcoin_card_body = $("<div></div>");
        $(vcoin_card_body).addClass("card-body"); 
        $(vcoin_card_body).addClass("vcoin-card-body");

        let vcoin_header = $("<div class='d-flex justify-content-between vcoin_header'></div>");
        
        let vcoin_symbol = $("<h3></h3>");
        $(vcoin_symbol).addClass("card-title");
        $(vcoin_symbol).text(vcoin.symbol);          
     
        let vcoin_toggle = $(`<input type="checkbox" data-toggle="toggle" 
            data-offstyle="danger" data-onstyle="success" data-style="ios" name="vcoin-toggle" ></input>`);  // 
        $(vcoin_toggle).addClass("vcoin_toggle"); 

        $(vcoin_toggle).change(function() {
            if (on_mark)
                return; /// marking after serch & print - NO ACTION!
            if (this.checked) {
                let vcoinPair = {
                    vcoin_id: vcoin.id,
                    vcoin_symbol: vcoin.symbol
                }
                coins_chosen.push(vcoinPair);   
                if (coins_chosen.length > MAX_COIN_IN_REPORT) {
                    vcoinsPopUp();
                }
            }
            else {
                for (let ivc=0 ; ivc < coins_chosen.length ; ivc++) {
                    if (coins_chosen[ivc].vcoin_id == vcoin.id) {
                        coins_chosen.splice(ivc,1);                        
                        break;
                    }                       
                }                
            }
        });

        let vcoin_name = $("<p></p>");
        $(vcoin_name).addClass("card-text");
        $(vcoin_name).text(vcoin.name);        

        let btn_info = $("<div class='btn btn-primary btn_more mb-2'></div>");        
        let btn_spinner1 = $(`<span class="spinner-border text-warning spinner-border-sm mx-2 btn-spinner1" role="status" aria-hidden="true"></span>`);
        // let btn_spinner1 = $(`<span class="spinner-grow spinner-grow-sm mx-2 btn-spinner1" role="status aria-hidden="true"></div>`)
        let btn_spinner2 = $(`<span class="sr-only">Loading...</span>`);
        $(btn_info).on("click",function(){
            if(!$(this).next().is(":visible")) {                
                // TODO/CHECK: find spinner1 INSIDE btn_info !!
                // $(this).first-child().has(".btn-spinner1").show(200);
                getVCoinMoreInfo(vcoin.id); // erase content & build & show
            } else {
                $(this).next().hide(500); // only hides
            }
        });

        let more_info = $("<div class='more_info p-1'></div>");
        $(vcoin_header).append(vcoin_symbol).append(vcoin_toggle);
        $(vcoin_card_body).append(vcoin_header).append(vcoin_name);        
        $(btn_info).append(btn_spinner1);      
        $(btn_info).append(btn_spinner2);              
        $(btn_info).append("More Info");
        $(vcoin_card_body).append(btn_info);      
        $(vcoin_card_body).append(more_info);  
        
        $(vcoin_card).append(vcoin_card_body);
        $("#virt-coins-wrapper div.row").append(vcoin_card);
}


/// POPUP FUNCS:

function vcoinsPopUp() {
    let last_chosen_id = coins_chosen[MAX_COIN_IN_REPORT].vcoin_id;
    let last_chosen_symbol = coins_chosen[MAX_COIN_IN_REPORT].vcoin_symbol;
    let last_chosen = coins_chosen.pop(); /// last is poped out. array is now with 5 coins.

    $(".popup-vcoins").html("");
    let popup_header =  $("<div class='d-flex justify-content-center popup_header pt-1 '></div>"); // m-1 p-2 mt-1 mb-1
    $(popup_header).append("<h4 class='text-center'><b>To Select:&nbsp</b></h4>");
    $(popup_header).append(`<h4 class='text-center'><b>${last_chosen_symbol}</b></h4>`);
    $(".popup-vcoins").append(popup_header);
    $(".popup-vcoins").append("<h2 class='text-center'><u>Remove One:</u></h2>");
  
    let selected_frame =  $("<div class='selected-frame px-2'></div>"); // m-1 p-2 mt-1 mb-1
    for (let idx=0; idx < coins_chosen.length ;idx++) {
        let vcoin_sel_line = $("<div class='d-flex justify-content-between vcoin_sel_line'></div>");
        let vcoin_sel_symbol = $(`<h4><b>${coins_chosen[idx].vcoin_symbol}</b></h4>`);
        let vcoin_select_toggle = $(`<input type="checkbox" checked data-toggle="toggle" name="vcoin-select-toggle" 
            class='vcoin_sel_toggle' data-toggle='toggle'  data-style="ios" data-offstyle="danger" data-onstyle="primary" ></input>`);  // data-toggle="toggle" data-style="ios"        
        
        $(vcoin_sel_line).append(vcoin_sel_symbol)        
        $(vcoin_sel_line).append(vcoin_select_toggle)                
        $(selected_frame).append(vcoin_sel_line)
    }

    let popup_alert_line = $(`<div class='d-flex alert alert-danger font-weight-bold 
                            text-sm-center my-0 py-1 popup_alert_line'></div>`);        
    $(popup_alert_line).text("[          ]");// defalut - for vertical space in pop up        
    $(selected_frame).append(popup_alert_line);    

    let popup_btn_line = $("<div class='d-flex justify-content-between popup_btn_line'></div>"); 
    let btn_cancel =  $("<div class='btn btn-danger m-1'>Cancel</div>");
    let btn_replace =  $("<div class='btn btn-success m-1'>Replace</div>");
    $(btn_replace).on("click",function(){
        let to_close = replaceCoins(last_chosen, last_chosen_id);
        if (to_close) {
            $(".popup-vcoins").hide(500);
            $(".cover-vcoins").hide(500);
        }        
    });
    $(btn_cancel).on("click",function(){
        // On Cancel: unselect last Toggle + last_chosen coin will not be re-insert to array (No Action needed)
        $(`div#vcoin_${last_chosen_id} .vcoin_toggle`).bootstrapToggle('off');
        $(".popup-vcoins").hide(500);
        $(".cover-vcoins").hide(500);
    });

    $(popup_btn_line).append(btn_cancel);
    $(popup_btn_line).append(btn_replace);
    $(selected_frame).append(popup_btn_line);    

    $(".popup-vcoins").append(selected_frame)
    $(".popup-vcoins .vcoin_sel_toggle").bootstrapToggle({
        on: 'ADD',
        off: 'OFF'
    }); 

    $(".cover-vcoins").show(500);
    $(".popup-vcoins").show(500);
}

function replaceCoins(last_chosen, last_chosen_id) {
    let removed_id = "";
    let removed_count = 0;
    let coins_chosen_len = coins_chosen.length;
    let curr_removed = null;

    for (let idx = 0 ; idx < coins_chosen_len ; idx++) {
        curr_removed = coins_chosen.shift(); // remove first
        let inner_toggle = $(`.popup-vcoins .vcoin_sel_toggle:eq(${idx})`);
        let is_checked = $(inner_toggle).prop("checked");
        if (is_checked) { 
            coins_chosen.push(curr_removed); // back to the array
         } else {
            removed_id = curr_removed.vcoin_id;
            removed_count++;    
            $(`div#vcoin_${removed_id} .vcoin_toggle`).bootstrapToggle('off');
         }
    }    
    if (removed_count > 0) {
        coins_chosen.push(last_chosen);
        return true; // = hide the pop up        
    } else {
        $(".popup_alert_line").text("NO COINS CHOSEN !");
        $(".popup_alert_line").css("visibility", "visible");
        return false; // = DON'T CLOSE THE POPUP !
    }    
}


/// SEARCH & MORE INFO FUNCS:

function searchVirtCoin() {
    let symbol_search =  $("#vcoin_search_text").val();
    symbol_search = symbol_search.trim();
    if (symbol_search.length == 0) {
        showVirtCoins(100, false);
    } else {
        showVirtCoins(100, true, symbol_search);
    }    
}

function getVCoinMoreInfo(selected_id) {

    let  coin_more_info = null;
    if ((coin_more_info = getCoinCache(selected_id)) != null) {        
        showMoreInfo(selected_id, coin_more_info, true);
        return;
    }

    let more_info_url = apiCoinMoreInfo + selected_id;
    $(`#vcoin_${selected_id} span.btn-spinner1`).show(500);
    $.ajax({
        url:more_info_url,
        type:"GET",
        data: {},
        success:function( result ){
            coin_more_data = result;
            showMoreInfo(selected_id, coin_more_data, false);
            saveMoreInfo(selected_id, coin_more_data);
            $(`#vcoin_${selected_id} span.btn-spinner1`).hide(500);
        },
        error:function( err ){
            console.log("Ajax getVCoinMoreInfo() return with Error:",err);
            $(`#vcoin_${selected_id} span.btn-spinner1`).hide(500);
        }
    })
}

// build and show the "More Info" coin part
function showMoreInfo(selected_id, coin_more_data, from_cache) {
    let more_info = $(`#vcoin_${selected_id} div.more_info`);
    $(more_info).html("");
    if (from_cache)
        $(more_info).append(`<img class="more_pic mt-1 p-1" src="${coin_more_data.image}" alt="picture of virt. coin ${coin_more_data.name}" >`); // thumb // small //large
    else
        $(more_info).append(`<img class="more_pic mt-1 p-1" src="${coin_more_data.image.large}" alt="picture of virt. coin ${coin_more_data.name}" >`);
    let more_info_inner = $("<div class='more_info_inner text-center'></div>");
    $(more_info_inner).append(`<h5><u>Market Price:</u></h5>`);
    if (from_cache) {
        $(more_info_inner).append(`<h6>USD: ${coin_more_data.curr_price_usd}$</h6>`);
        $(more_info_inner).append(`<h6>EUR: ${coin_more_data.curr_price_eur}&#x20AC</h6>`);    
        $(more_info_inner).append(`<h6>ILS: ${coin_more_data.curr_price_ils}&#x20aa</h6>`);
    } else {
        $(more_info_inner).append(`<h6>USD: ${coin_more_data.market_data.current_price.usd}$</h6>`);
        $(more_info_inner).append(`<h6>EUR: ${coin_more_data.market_data.current_price.eur}&#x20AC</h6>`);    
        $(more_info_inner).append(`<h6>ILS: ${coin_more_data.market_data.current_price.ils}&#x20aa</h6>`);
    }
    $(more_info).append(more_info_inner);
    $(more_info).show(500); // show only after 'More Info' is ready 
}

function getCoinCache(selected_id) {
    if (more_info_cache.length == 0)
        return null; // NO DATA IN CACHE
    for (let idx = 0 ; idx < more_info_cache.length; idx++) {
        if (more_info_cache[idx].id == selected_id) {
            let objDate = new Date();
            let curr_time = objDate.getTime();
            let time_diff_minutes = (curr_time - more_info_cache[idx].save_datetime)/60000;
            if (time_diff_minutes < 2) // TAKE FROM CACHE
                return (more_info_cache[idx]);
            else { 
                more_info_cache.splice(idx, 1); // DELETE FROM CACHE
                localStorage.more_info_cache_ls = JSON.stringify(more_info_cache); // Save in LS
                return null;
            }
            
        }
    }
   
    return null; // MORE INFO NOT FOUND
}

function saveMoreInfo(selected_id, coin_more_data) {
    let d = new Date();
    let more_info_rec = {
        id: selected_id,
        image: coin_more_data.image.large,
        curr_price_usd: coin_more_data.market_data.current_price.usd,
        curr_price_eur: coin_more_data.market_data.current_price.eur,
        curr_price_ils: coin_more_data.market_data.current_price.ils,
        save_datetime: d.getTime()     
    }

    more_info_cache.push(more_info_rec);
    localStorage.more_info_cache_ls = JSON.stringify(more_info_cache); // Save in LS    
}

///////// Main Tabs Click Functions  ////////////////////
function tabHomeClick() {
    if(stop_graph != null)
        clearInterval(stop_graph);
}

function tabAboutClick() {
    if(stop_graph != null)
        clearInterval(stop_graph);
}

//// GRAPH AND V.COINS API COMPARE FUNCS:   ////////////////////////////////////

// var apiCoinsCompare = "https://min-api.cryptocompare.com/data/pricemulti?fsyms=";
// https://min-api.cryptocompare.com/data/pricemulti?fsyms=BTC,ETH&tsyms=USD

var graph_options = {
	exportEnabled: true,
	animationEnabled: true,
	title:{
        text: ""
        // text: "Current Rates: "
	},
	subtitles: [{
		text: "Click Legend to Hide or Unhide Data Series"
	}],
	axisX: {
        title: "Hours:Minutes:Seconds"
	},
	axisY: {
        title: "Coin Value",
		titleFontColor: "#4F81BC",
		lineColor: "#4F81BC",
		labelFontColor: "#4F81BC",
		tickColor: "#4F81BC",
		includeZero: false
	},
	// axisY2: {
	// 	title: "Profit in USD",
	// 	titleFontColor: "#C0504E",
	// 	lineColor: "#C0504E",
	// 	labelFontColor: "#C0504E",
	// 	tickColor: "#C0504E",
	// 	includeZero: false
	// },
	toolTip: {
		shared: true
	},
	legend: {
		cursor: "pointer",
		itemclick: toggleDataSeries
	},
	data: [] /*
        {
		type: "spline",
		name: "ETH",
		showInLegend: true,
        xValueFormatString: "HH:mm:ss",                
		yValueFormatString: "$##,###.##",
		dataPoints: [
            // { x: new Date(2019,09,04,00,15,00),  y: 120 },
            // { x: new Date(2019,09,04,00,15,02), y: 135 }, 
            // { x:  $.now(), y: 142 }			
		]
	},
	{
		type: "spline",
		name: "BTC",
		axisYType: "secondary",
		showInLegend: true,      
        xValueFormatString: "mm",            
        yValueFormatString: "$##,###.##",        
		dataPoints: [
            // { x: new Date(2019,09,04,00,15,00),  y: 19034.5 },
            // { x: new Date(2019,09,04,00,15,02),  y: 20015 },
        	// { x: new Date(2019,09,04,00,15,04),  y: 27342  },    
            // { x: $.now(), y: 32534 }
		]
    }*/
    // ]
};

function toggleDataSeries(e) {
	if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
		e.dataSeries.visible = false;
	} else {
		e.dataSeries.visible = true;
	}
	e.chart.render();
}

function graphPrepare(vcoins_list) {
    let len = vcoins_list.length;
    if (len == 0) {
        console.log(" -- getVirtCoinsCompare() - NO COINS WERE CHOSEN !");
        $(".report-alert").text("NO COINS WERE CHOSEN !");
        $(".report-alert").show(500);
        $(".virt-coins-graph").hide(100);
        return true; // = abort graph
    }    
    graph_options.title.text = "Current Rates: ";
    graph_options.title.text += vcoins_list[0].vcoin_symbol.toUpperCase();
    for (let idx = 1 ; idx < vcoins_list.length ; idx++) {
        let symbol = vcoins_list[idx].vcoin_symbol.toUpperCase();
        graph_options.title.text += ("," + symbol);
    }
    graph_options.title.text += " to USD";
    $(".virt-coins-graph").show(100);
    return false; // = continue
}

var stop_graph = null;
function getVCoinsGraph() {
    $(".report-alert").hide(100);
    graph_options.data = [];
    let abort = graphPrepare(coins_chosen);
    if (abort)
        return;    
    getVirtCoinsCompare(coins_chosen, true); // first time = init the graph options !
    stop_graph = setInterval(function(){getVirtCoinsCompare(coins_chosen, false)}, 2000); 
}

function addDataOption (coin_idx, vcoin_symbol) {
    let new_option = {
        type: "spline",
		name: vcoin_symbol,
		showInLegend: true,
        xValueFormatString: "HH:mm:ss",                
        // xValueFormatString: "mm:ss",           
		yValueFormatString: "$##,###.##",
		dataPoints: []
    }
    graph_options.data.push(new_option);
}

function addDataPoint (coin_idx, vcoin_symbol) {
    let dps = createDataPoint(coins_compare[vcoin_symbol].USD);
    graph_options.data[coin_idx].dataPoints.push(dps);
}

const MAX_DATA_POINTS = 25;

function removeLastPoint (coin_idx) {
    if (graph_options.data[coin_idx].dataPoints.length > MAX_DATA_POINTS) {
        graph_options.data[coin_idx].dataPoints.shift();
    }   
}

function createDataPoint(coinVal) {
    let currDataPoint = {
        x: new Date($.now()), // (new Date).getTime();
        y: coinVal
    }
    return currDataPoint;
}

// Get Compare Data for the chosen coins
function getVirtCoinsCompare(coins_list, init_graph){    
    let url_coins_compare = apiCoinsCompare;
    let len = coins_list.length;   
    url_coins_compare += coins_list[0].vcoin_symbol.toUpperCase();    
    if (init_graph)
        $(".home-spinner").show(100);
    for (let idx=1; idx < len; idx++) {
        url_coins_compare += "," + coins_list[idx].vcoin_symbol.toUpperCase();
    }
    url_coins_compare += "&tsyms=USD";

    $.ajax({
        url: url_coins_compare,
        type:"GET",
        data: {},
        success:function( result ){
            coins_compare = result;            
            for (let idx = 0 ; idx < coins_list.length ; idx++) {                
                let vcoin_symbol = coins_list[idx].vcoin_symbol.toUpperCase(); 
                let vcoin_res = coins_compare[vcoin_symbol];                
                if (vcoin_res == undefined || vcoin_res.USD == undefined) {
                    if (init_graph)
                        addDataOption(idx, vcoin_symbol);
                    continue; // next coin result ..                    
                }                    
                if (init_graph) { // add data option and first point
                    addDataOption(idx, vcoin_symbol);                    
                    addDataPoint(idx, vcoin_symbol);
                    $("#vcoinsChartContainer").CanvasJSChart(graph_options);
                }
                else { // iterate graph - add data points                   
                    addDataPoint(idx, vcoin_symbol);
                    removeLastPoint(idx);                    
                    let chart1 = $("#vcoinsChartContainer").CanvasJSChart();
                    chart1.render();
                }
            }           
            $(".home-spinner").hide(500);
        },
        error:function( err ){
            console.log("Ajax getVirtCoinsCompare() return with Error:",err);
            $(".home-spinner").hide(500);
        }
    })
}
