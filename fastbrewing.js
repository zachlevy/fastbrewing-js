// scrolls hacky fix
function goScroll(anchor) {
  window.location.href = "#" + anchor;
}

$(document).ready(function() {

  console.log('fastbrewing.js');

  // globals
  var globalStores;
  var storesTable;

  // products wrap
  if ($('.products-list').length > 0) {
    // hide initially
    // $('.products-list').hide();
    // $('.products-list').css('visibility', 'hidden');
    console.log('home page');
    $('.products-list').show('slide', { direction: "left" });
  }

  $('.products-list img').hover(function() {
    $(this).addClass('product-hover');

  }, function() {
    $(this).removeClass('product-hover');
  });

  // colorbox
  $('a.product-gallery-photo').colorbox({rel:'product-gallery'});

  // accounts STORES
  // accounts store url
  var online_accounts_production_url = "http://fastbrewing-production.herokuapp.com/accounts/online.json";
  var online_accounts_staging_url = "http://fastbrewing-staging.herokuapp.com/accounts/online.json";
  var online_accounts_development_url = "http://localhost:3000/accounts/online.json";
  var accounts_url = online_accounts_development_url;
  console.log(accounts_url);

  // splash modal detector and checker
  if ($('#splash-modal').length > 0) {
    console.log('splash-modal present');
    checkCookie();
  }

  // splash modal detector tester
  if ($('#test-splash-modal').length > 0) {
    $('#splash-modal').modal('show');
  }

  $('#splash-modal .splash-buttons a').on('click', function() {
    console.log('splash-modal button clicked');
    setCookie();
    $('#splash-modal').modal('hide');
  });

  if ($('#online-stores-table').length > 0) {
    getOnlineAccounts(accounts_url);
  }

  // if store details wrappers exists
  if ($('#account-panel').length > 0 && $('#account-map').length > 0) {
    var account_id = getQueryVariable("account_id");
    buildAccountDetails(account_id);
  }

  // renders a url if the string has http in it
  function render_url(text) {
    if (text.includes("http")) {
      return "<a href=\"" + text + "\" target=\"_blank\">Buy Here</a>";
    } else {
      return text;
    }
  };

  function getOnlineAccounts(url) {
    $.getJSON(url, function( data ) {

      var rows = [];

      // add account to table
      $.each(data, function(index, account) {
        // console.log(account.id + " start");
        // console.log(account);

        row = buildAccountRow(account, true);
        rows.push(row);

      });

      document.getElementById("online-stores-table-tbody").innerHTML = rows.join("");

      // make the table a datatable
      $('#online-stores-table').DataTable({
        paging: false,
        info: false,
        fixedHeader: true
      });
    });
  }

  // STORES
  // store urls
  var stores_production_url = "http://fastbrewing-production.herokuapp.com/stores/map";
  var stores_staging_url = "http://fastbrewing-staging.herokuapp.com/stores/map";
  var stores_development_url = "http://localhost:3000/stores/map";
  var stores_url = stores_development_url;
  console.log(stores_url);

  var accounts_salesforce_production_url = "http://fastbrewing-production.herokuapp.com/accounts/physical.json";
  var accounts_salesforce_staging_url = "http://fastbrewing-staging.herokuapp.com/accounts/physical.json";
  var accounts_salesforce_development_url = "http://localhost:3000/accounts/physical.json";
  var accounts_salesforce_url = accounts_salesforce_development_url;
  console.log(accounts_salesforce_url);

  // stores
  if ($('#stores-map').length > 0 && $('#accounts-table').length > 0) {
    createStoresMap();
    getAccountsSalesforce(accounts_salesforce_url);
  }

  function addAccountsToTable(accounts) {
    console.log(accounts.length);
    var rows = [];
    // add account to table
    $.each(accounts, function(index, account) {
      row = buildAccountRow(account, false);
      rows.push(row);
      mapAccount(account);
    });
    document.getElementById("accounts-table-tbody").innerHTML = rows.join("");
  }

  // get salesforce stores json from external url
  function getAccountsSalesforce(url) {
    console.log("getAccountsSalesforce");

    // ajax
    $.getJSON(url, function( data ) {
      addAccountsToTable(data);
      $('#accounts-table .pricing-popover').popover();
      // make the table a datatable
      accountsTable = $('#accounts-table').DataTable({
        paging: false,
        info: false,
        fixedHeader: true
      });

      // accountsTable.column(2).visible(false);
      // accountsTable.column(3).visible(false);

      createSelectFilter('#country-filter-wrap', 3, "Country");
      createSelectFilter('#state-filter-wrap', 2, "State/Province");

    });
  }

  // builds the account row for the accounts table
  function buildAccountRow(account, online) {
    // fastrack popover content
    // fr_24_combo_price
    // fr_12_combo_price
    // fr_24_rack_price
    // fr_24_tray_price
    // fr_12_rack_price
    // fr_12_tray_price
    // fr_weblink
    var fr_pc = "<table>";
    fr_pc += "<tr><td><strong>FR24 Combo</strong></td><td>" + generatePrice(account.fr_24_combo_price) + "</td></tr>";
    fr_pc += "<tr><td><strong>FR24 Rack</strong></td><td>" + generatePrice(account.fr_24_rack_price) + "</td></tr>";
    fr_pc += "<tr><td><strong>FR24 Tray</strong></td><td>" + generatePrice(account.fr_24_tray_price) + "</td></tr>";
    fr_pc += "<tr><td><strong>FR12 Combo</strong></td><td>" + generatePrice(account.fr_12_combo_price) + "</td></tr>";
    fr_pc += "<tr><td><strong>FR12 Rack</strong></td><td>" + generatePrice(account.fr_12_rack_price) + "</td></tr>";
    fr_pc += "<tr><td><strong>FR12 Tray</strong></td><td>" + generatePrice(account.fr_12_tray_price) + "</td></tr>";
    if (account.fr_weblink != null && account.fr_weblink.length > 10) {fr_pc += '<tr><td><strong>Web Link<strong></td><td><a href=\'' + ensureHttpInUrl(account.fr_weblink) + '\' target=\'_blank\'>web link</a></td></tr>';} else {fr_pc += '<tr><td><strong>Web Link<strong></td><td>None</td></tr>';}
    fr_pc += "</table>";

    // fastferment popover content
    // ff_beer_starter_kit_price
    // ff_wine_starter_kit_price
    // ff_only_bundle_kit_price
    // ff_starter_kit_weblink
    var ff_sk_pc = "<table>";
    ff_sk_pc += "<tr><td><strong>FF Beer Starter Kit</strong></td><td>" + generatePrice(account.ff_beer_starter_kit_price) + "</td></tr>";
    ff_sk_pc += "<tr><td><strong>FF Wine Starter Kit</strong></td><td>" + generatePrice(account.ff_wine_starter_kit_price) + "</td></tr>";
    ff_sk_pc += "<tr><td><strong>FF Only Bundle Kit</strong></td><td>" + generatePrice(account.ff_only_bundle_kit_price) + "</td></tr>";
    if (account.ff_starter_kit_weblink != null && account.ff_starter_kit_weblink.length > 10) {ff_sk_pc += '<tr><td><strong>Web Link<strong></td><td><a href=\'' + ensureHttpInUrl(account.ff_starter_kit_weblink) + '\' target=\'_blank\'>web link</a></td></tr>';} else {ff_sk_pc += '<tr><td><strong>Web Link<strong></td><td>None</td></tr>';}
    ff_sk_pc += "</table>";

    // fastferment starter kit popover content
    // ff_fermenter_price
    // ff_stand_price
    // ff_temperature_jacket_price
    // ff_thermometer_price
    // ff_spigot_price
    // ff_strap_price
    // ff_extra_collection_ball_price
    // ff_weblink
    var ff_pc = "<table>";
    ff_pc += "<tr><td><strong>FF Fermenter</strong></td><td>" + generatePrice(account.ff_fermenter_price) + "</td></tr>";
    ff_pc += "<tr><td><strong>FF Stand</strong></td><td>" + generatePrice(account.ff_stand_price) + "</td></tr>";
    ff_pc += "<tr><td><strong>FF Temperature Jacket</strong></td><td>" + generatePrice(account.ff_temperature_jacket_price) + "</td></tr>";
    ff_pc += "<tr><td><strong>FF Thermometer</strong></td><td>" + generatePrice(account.ff_thermometer_price) + "</td></tr>";
    ff_pc += "<tr><td><strong>FF Spigot</strong></td><td>" + generatePrice(account.ff_spigot_price) + "</td></tr>";
    ff_pc += "<tr><td><strong>FF Strap</strong></td><td>" + generatePrice(account.ff_strap_price) + "</td></tr>";
    ff_pc += "<tr><td><strong>FF Extra Collection Ball</strong></td><td>" + generatePrice(account.ff_extra_collection_ball_price) + "</td></tr>";
    if (account.ff_weblink != null && account.ff_weblink.length > 10) {ff_pc += '<tr><td><strong>Web Link<strong></td><td><a href=\'' + ensureHttpInUrl(account.ff_weblink) + '\' target=\'_blank\'>web link</a></td></tr>';} else {ff_pc += '<tr><td><strong>Web Link<strong></td><td>None</td></tr>';}
    ff_pc += "</table>";

    // fastlabel popover content
    // fl_12oz_price
    // fl_22oz_price
    // fl_weblink
    var fl_pc = "<table>";
    fl_pc += "<tr><td><strong>FL 12oz</strong></td><td>" + generatePrice(account.fl_12oz_price) + "</td></tr>";
    fl_pc += "<tr><td><strong>FL 22oz</strong></td><td>" + generatePrice(account.fl_22oz_price) + "</td></tr>";
    fl_pc += '<td><strong>Web Link<strong></td>';
    if (account.fl_weblink != null && account.fl_weblink.length > 10) {fl_pc += '<tr><td><strong>Web Link<strong></td><td><a href=\'' + ensureHttpInUrl(account.fl_weblink) + '\' target=\'_blank\'>web link</a></td><td></td></tr>';} else {fl_pc += '<tr><td><strong>Web Link<strong></td><td>None</td></tr>';}
    fl_pc += "</table>";

    // Id
    // Account Name
    // Address
    // Website
    // Phone
    // FF
    // FF Starter Kits
    // FR
    // FL
    // Speed Challenge Date
    row = '<tr id="account-' + account.id + '">';
    // if (store.store_name) {row += '<td><a href="/retailers-and-wholesalers-buy/store-details?store_id=' + store.id + '" target="_blank">' + store.store_name + '</a></td>';} else {row += '<td></td>';}
    row += "<td>" + account.name + "</td>";
    if (!online) {
      if (account.address != null) {row += '<td>' + account.address + '</td>';} else {row += '<td></td>';}
    }
    if (account.state != null) {row += '<td>' + account.state + '</td>';} else {row += '<td></td>';}
    if (account.country != null) {row += '<td>' + account.country + '</td>';} else {row += '<td></td>';}
    if (account.website != null && account.website.indexOf("http") > -1) {row += '<td><a href="' + account.website + '" target="_blank">website</a></td>';} else {row += '<td></td>';}
    if (!online) {
      if (account.phone != null) {row += '<td>' + account.phone + '</td>';} else {row += '<td></td>';}
    }
    row += '<td><a type="button" class="pricing-popover" data-trigger="click" data-html="true" data-placement="left" data-toggle="popover" title="FastFerment Pricing" data-content="' + ff_pc + '">Pricing</a></td>';
    row += '<td><a type="button" class="pricing-popover" data-trigger="click" data-html="true" data-placement="left" data-toggle="popover" title="FastFerment Starter Kit Pricing" data-content="' + ff_sk_pc + '">Pricing</a></td>';
    row += '<td><a type="button" class="pricing-popover" data-trigger="click" data-html="true" data-placement="left" data-toggle="popover" title="FastRack Pricing" data-content="' + fr_pc + '">Pricing</a></td>';
    row += '<td><a type="button" class="pricing-popover" data-trigger="click" data-html="true" data-placement="left" data-toggle="popover" title="FastLabel Pricing" data-content="' + fl_pc + '">Pricing</a></td>';
    if (!online) {
      if (account.fr_speed_challenge_date != null) {row += '<td>' + account.fr_speed_challenge_date + '</td>';} else {row += '<td></td>';}
    }
    row += "</tr>";
    // returns row html
    return row
  }

  // generates price text
  function generatePrice(price) {
    if (typeof price == "undefined" || price == null) {
      return "Not yet - Hopefully soon"
    } else if (price == 0) {
      return "Available - Ask in Store"
    } else {
      return parseFloat(price).toFixed(2);
    }
  }

  function createSelectFilter (selector, columnIndex, label) {
    // create select box
    var select = $('<select id="select-filter-' + columnIndex + '" class="form-control input-lg"><option value=""></option></select>')
      .appendTo($(selector).empty())
      .on('change', function () {
        // console.log($(this).val());

        // show the table
        $('#accounts-table_wrapper').show();

        var val = $.fn.dataTable.util.escapeRegex(
          $(this).val()
        );
        accountsTable.column(columnIndex)
          .search( val ? '^'+val+'$' : '', true, false )
          .draw();
      });

    // add usa and canada options first by client request
    if (label == "Country") {
      select.append('<option value="USA">USA</option>');
      select.append('<option value="Canada">Canada</option>');
      select.append('<option value="">-------------</option>');
    }
    // add options to select
    accountsTable.column(columnIndex).data().unique().sort().each(function ( d, j ) {
      select.append('<option value="'+d+'">'+d+'</option>')
    });
  }

  // create the map for stores
  function createStoresMap () {
    storesMap = new GMaps({
      div: '#stores-map',
      lat: 24.575454,
      lng: -0.623357,
      zoom: 2
    });
  }

  // adds http to the start of a url if it isn't there already
  function ensureHttpInUrl (text) {
    if (text == null || text == "") {
      return text;
    } else if (text.includes("http")) {
      return text;
    } else {
      return "http://" + text;
    }
  }

  // place the account on the map
  function mapAccount (account) {
    if (account.latitude == null) {
      return;
    }
    // build the popup
    popup = '<div class="map-popup">';
    if (account.name) {popup += '<h3>' + account.name + '</h3>';}
    // if (account.name) {popup += '<h3><a href="/retailers-and-wholesalers-buy/account-details?account_id=' + account.id + '" target="_blank">' + account.account_name + '</a></h3>';}
    if (account.full_address) {popup += '<p>' + account.full_address + '</p>';}
    if (account.phone) {popup += '<p>' + account.phone + '</p>';}
    if (account.website) {popup += '<p><a href="' + ensureHttpInUrl(account.website) + '" target="_blank">website</a></p>';}
    popup += '<a class="pricing-popover" data-toggle="modal" data-target="#account-modal">Pricing</a>'
    popup += '</div>';

    // add marker
    storesMap.addMarker({
      lat: account.latitude,
      lng: account.longitude,
      infoWindow: {
        content: popup
      }
    });
  }


  // EVENTS

  // event urls
  events_url = "/fastrack/speed-challenge/events/json";

  // conditionals for displaying map and/or table
  if ($('#events-map').length > 0 && $('#events-table').length > 0) {
    // if both events map and table are present, combine to save calc time
    // events map
    createEventsMap();
    getEvents(events_url, true, true);
  } else if ($('#events-map').length > 0) {
    // if only events-map is present
    // events map
    createEventsMap();
    getEvents(events_url, false, true);
  } else if ($('#events-table').length > 0) {
    // if only events-table is present
    getEvents(events_url, false, true);
  }

  // create events map
  function createEventsMap () {
    eventsMap = new GMaps({
      div: '#events-map',
      lat: 24.575454,
      lng: -0.623357,
      zoom: 2
    });
  }

  // get events json from external url
  function getEvents(url, showEventsMap, showEventsTable) {
    // default params to false
    showEventsMap = typeof showEventsMap !== 'undefined' ? showEventsMap : false;
    showEventsTable = typeof showEventsTable !== 'undefined' ? showEventsTable : false;

    // ajax
    $.getJSON(url, function( data ) {
      if (showEventsTable === true) {
        // if showing table
        // map the locations and add them to the table
        $.each(data, function(index, location) {
          // console.log(location);
          row = "";
          row += '<tr>';
          if (location.date) {row += '<td>' + location.date + '</td>';} else {row += '<td></td>';}
          if (location.club_name) {row += '<td>' + location.club_name + '</td>';} else {row += '<td></td>';}
          if (location.phone) {row += '<td>' + location.phone + '</td>';} else {row += '<td></td>';}
          if (location.website) {row += '<td><a href="' + location.website + '" target="_blank">website</a></td>';} else {row += '<td></td>';}
          // if (location.address) {row += '<td>' + location.address + '</td>';} else {row += '<td></td>';}
          row += '</tr>';
          $('#events-table tbody').append(row);

          // get address and add to map
          // if showing both map and table
          if (showEventsMap === true) {
            mapEvent(location);
          }
        });
        // make the table a datatable
        $('#events-table').DataTable({
          paging: false,
          info: false
        });
      } else if (showEventsMap === true) {
        // if showing only map
        mapEvent(location);
      }

      // console.log(data);
    });
  }

  // geocoding event locations and placing markers
  function mapEvent (location) {
    // build the popup
    popup = "";
    if (location.club_name) {popup += '<h3>' + location.club_name + '</h3>';}
    if (location.date) {popup += '<p>' + location.date + '</p>';}
    if (location.phone) {popup += '<p>' + location.phone + '</p>';}
    if (location.website) {popup += '<p><a href="' + location.website + '" target="_blank">website</a></p>';}
    if (location.address) {popup += '<p>' + location.address + '</p>';}

    // add marker
    eventsMap.addMarker({
      lat: location.latitude,
      lng: location.longitude,
      infoWindow: {
        content: popup
      }
    });
  }

  // account finder submit listener
  $('#filter-submit').on('click', function () {
    console.log('submit clicked');
    address = $('#filter-code').val();

    // show the table
    $('#accounts-table_wrapper').show();

    geocodeAddress(address);

  });

  // get google place with lat/lng in result
  function geocodeAddress (address) {
    var url = "http://maps.googleapis.com/maps/api/geocode/json?address=" + address;
    $.getJSON(url, function(data) {
      // console.log(data);
      var location = data.results[0].geometry.location;
      // console.log(location.lat, location.lng);

      // set map
      storesMap.setCenter(location.lat, location.lng, function () {
        storesMap.setZoom(11);
      });

      // redraw the accounts table
      var latitude_to_s = location.lat.toString().replace('.', ',');
      var longitude_to_s = location.lng.toString().replace('.', ',');

      var accounts_location_production_url = 'http://fastbrewing-production.herokuapp.com/accounts/near?latitude=' + latitude_to_s + '&longitude=' + longitude_to_s;
      var accounts_location_staging_url = 'http://fastbrewing-staging.herokuapp.com/accounts/near?latitude=' + latitude_to_s + '&longitude=' + longitude_to_s;
      var accounts_location_development_url = 'http://localhost:3000/accounts/near?latitude=' + latitude_to_s + '&longitude=' + longitude_to_s;
      var accounts_locations_url = accounts_location_development_url;
      console.log(accounts_locations_url);

      $.getJSON(accounts_locations_url, function (data) {
        accountsTable.clear().draw();
        addAccountsToTable(data);
        // accountsTable.draw();
        $('#accounts-table .pricing-popover').popover();
      });
    });
  }

  // GET vars from url
  function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
      var pair = vars[i].split("=");
      if(pair[0] == variable){return pair[1];}
    }
    return(false);
  }

  // store details page
  function buildAccountDetails (account_id) {

    // console.log(store_id);

    var account_details_production_url = "http://fastbrewing-production.herokuapp.com/accounts/" + account_id + ".json";
    var account_details_staging_url = "http://fastbrewing-staging.herokuapp.com/accounts/" + account_id + ".json";
    var account_details_development_url = "http://localhost:3000/accounts/" + account_id + ".json";
    var url = account_details_development_url;
    console.log(url);

    $.getJSON(url, function(account) {
      $('#account-name').html(account.account_name);
      $('#account-full-address').html(account.full_address);
      $('#account-website').html('<a href="' + account.website + '" target="_blank">website</a>');
      $('#account-phone').html(account.phone);
      $('#account-email').html('<a href="mailto:' + account.email + '">' + account.email + '</a>');

      if (account.latitude > 0) {
        accountMap = new GMaps({
          div: '#account-map',
          lat: account.latitude,
          lng: account.longitude
        });

        accountMap.addMarker({
          lat: account.latitude,
          lng: account.longitude
        });
      }



    });
  }

  // reviews start
  var reviews_production_url = "http://fastbrewing-production.herokuapp.com/reviews.json";
  var reviews_staging_url = "http://fastbrewing-staging.herokuapp.com/reviews.json";
  var reviews_development_url = "http://localhost:3000/reviews.json";
  var reviews_url = reviews_development_url;

  $("#rating-success").hide();
  $("#rating-failure").hide();

  // review form submit
  $("#review-form").submit(function(e) {
    console.log("review-form submit");

    var url = reviews_url;
    var data = {
      "review": {
        "rating": $("#review-form").find('input[name="rating"]:checked').val(),
        "comment": $("#review-form").find('textarea[name="comment"]').val(),
        "name": $("#review-form").find('input[name="name"]').val()
      }
    };

    console.log(data);
    $.ajax({
      type: "POST",
      url: url,
      data: data,
      success: function(data) {
        console.log(data);
        $("#rating-success").show();
        $("#review-form").find('input[name="rating"]').val(null);
        $("#review-form").find('textarea[name="comment"]').val(null);
        $("#review-form").find('input[name="name"]').val(null);
      },
      failure: function(data) {
        console.log(data);
        $("#rating-failure").hide();
      }
    });

    e.preventDefault(); // avoid to execute the actual submit of the form.
  });

  // get reviews
  // $.getJSON(reviews_url + "?approved=true", function(reviews) {
  $.getJSON(reviews_url + "", function(reviews) {
    console.log(reviews);
    html = ""
    html += '<div class="testimonials-wrap"><div class="row">';
    $.each(reviews, function(index, review) {
      // // close row
      // if (index % 3 === 0 && index != 1) {
      //   html += '</div>';
      // };
      // // open row
      // if (index % 3 === 0) {
      //   html += '<div class="row">';
      // };

      // open review
      // html += '<div class="user-review col-xs-12 col-sm-4">' +
      html += '<div class="user-review">' +
              '<div class="review-wrap">';
      // stars
      if (review.rating != null) {
        // html += '<h3>' + review.rating + '</h3>';
        html += '<div class="rating">'
        var stars = review.rating;
        while (stars > 0) {
          html += '<label class="show"></label>';
          stars -= 1;
        }
        html += '</div>';
      }
      html += '<p class="review">' +
              '<span class="dropcap">' +
              '<img src="/sites/all/themes/fastbrewing/images/quotation_marks.png" class="img-responsive">' +
              '</span>';
      if (review.comment != null) {
        html += review.comment;
      }
      html += '</p>';
      // byline
      if (review.name != null && review.name != "") {
        html += '<p><strong>- by ' + review.name + '</strong></p>';
      } else {
        html += '<p><strong>- by anonymous</strong></p>';
      }
      // close review
      html += '</div>'+
              '</div>';
    });
    // console.log(html);
    html += '</div></div>';
    $("#reviews").html(html);

  });

});

// splash page cookie
function checkCookie() {
  var splash=getCookie("splash");
  //var splash=getCookie("none");
  if (splash!="true") {
    // if the cookie does not exist
    jQuery('#splash-modal').modal('show');
    console.log('show splash');
  } else {
    // if the cookie exists
    console.log('dont show splash');
  }
}

// splash page cookie
function getCookie(cname) {
  var name = cname + "=";
  var ca = document.cookie.split(';');
  for(var i=0; i<ca.length; i++) {
    var c = ca[i].trim();
    if (c.indexOf(name)==0) return c.substring(name.length,c.length);
  }
  return "";
}

// set teh cookie splash=true
function setCookie(){
  days=3; // number of days to keep the cookie
  myDate = new Date();
  myDate.setTime(myDate.getTime()+(days*86400));
  document.cookie = 'splash=true; expires=' + myDate.toGMTString();
  console.log("splash cookie set");
  console.log(document.cookie = 'splash=true; expires=' + myDate.toGMTString());
}
