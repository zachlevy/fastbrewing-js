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

  // ONLINE STORES
  // online store url
  var online_stores_production_url = "http://fastbrewing-production.herokuapp.com/online_stores/map";
  var online_stores_staging_url = "http://fastbrewing-staging.herokuapp.com/online_stores/map";
  var online_stores_development_url = "http://localhost:3000/online_stores/map";
  var stores_url = online_stores_development_url;
  console.log(stores_url);

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

    // for getting store that carry a given product
    var inventory_id = getQueryVariable("inventory_id");
    if (inventory_id > 0) {
      stores_url += ("/inventories/" + inventory_id)
    }
    getOnlineStores(stores_url);
  }

  // if store details wrappers exists
  if ($('#store-panel').length > 0 && $('#store-map').length > 0) {
    buildStoreDetails();
  }

  // renders a url if the string has http in it
  function render_url(text) {
    if (text.includes("http")) {
      return "<a href=\"" + text + "\" target=\"_blank\">Buy Here</a>";
    } else {
      return text;
    }
  };

  function getOnlineStores(url) {
    $.getJSON(url, function( data ) {

      // build the table headers for each product
      $.each(data.result.inventories, function(index, product) {
        $('#online-stores-table thead tr').append('<th>' + product.name + '</th>');
      });

      // map the stores and add them to the table
      $.each(data.result.stores, function(index, store) {
        // console.log(store);
        row = "";
        row += '<tr>';
        if (store.country) {row += '<td>' + store.country + '</td>';} else {row += '<td></td>';}
        if (store.state) {row += '<td>' + store.state + '</td>';} else {row += '<td></td>';}
        if (store.website) {row += '<td><a href="' + store.website + '" target="_blank">' + store.store_name + '</a></td>';} else {row += '<td></td>';}
        // add where the store has the product
        $.each(store.inventories, function(index, inv) {
          if (inv.inventory) {
            row += '<td>' + render_url(inv.inventory) + '</td>';
          } else {
            row += '<td></td>';
          }
        });
        row += '</tr>';
        $('#online-stores-table tbody').append(row);
      });

      // make the table a datatable
      $('#online-stores-table').DataTable({
        paging: false,
        info: false,
        order: [[ 0, "desc" ]],
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

  var accounts_salesforce_production_url = "http://fastbrewing-production.herokuapp.com/accounts.json";
  var accounts_salesforce_staging_url = "http://fastbrewing-staging.herokuapp.com/accounts.json";
  var accounts_salesforce_development_url = "http://localhost:3000/accounts.json";
  var accounts_salesforce_url = accounts_salesforce_development_url;
  console.log(accounts_salesforce_url);

  // stores
  if ($('#stores-map').length > 0 && $('#stores-table').length > 0) {
    // if both stores map and table are present, combine to save calc time

    // for getting store that carry a given product
    var inventory_id = getQueryVariable("inventory_id");
    if (inventory_id > 0) {
      stores_url += ("/inventories/" + inventory_id)
    }

    // stores map
    createStoresMap();
    getStores(stores_url, true, true);

    // salesforce
    getAccountsSalesforce(accounts_salesforce_url, true, true);
  } else if ($('#stores-map').length > 0) {
    // if only stores-map is present
    // stores map
    createStoresMap();
    getStores(stores_url, false, true);
    // salesforce
    getAccountsSalesforce(accounts_salesforce_url, true, false);
  } else if ($('#stores-table').length > 0) {
    // if only stores-table is present
    getStores(stores_url, false, true);
    // salesforce
    getAccountsSalesforce(accounts_salesforce_url, false, true);
  }

  // get salesforce stores json from external url
  function getAccountsSalesforce(url, showAccountsMap, showAccountsTable) {
    showAccountsMap = typeof showAccountsMap !== 'undefined' ? showAccountsMap : false;
    showAccountsTable = typeof showAccountsTable !== 'undefined' ? showAccountsTable : false;

    // ajax
    $.getJSON(url, function( data ) {

      var accounts = data;
      // console.log(accounts);
      console.log(accounts.length);

      var rows = [];

      // add account to table
      $.each(accounts, function(index, account) {
        // console.log(account.id + " start");
        // console.log(account);

        row = buildAccountRow(account);
        // console.log(row)
        // console.log(account.id + " end");
        rows.push(row);

        mapAccount(account);
      });

      document.getElementById("accounts-table-tbody").innerHTML = rows.join("");

      $('#accounts-table .pricing-popover').popover();

      // make the table a datatable
      accountsTable = $('#accounts-table').DataTable({
        paging: false,
        info: false,
        fixedHeader: true
      });

      accountsTable.column(2).visible(false);
      accountsTable.column(3).visible(false);

      createSelectFilter('#country-filter-wrap', 3, "Country");
      createSelectFilter('#state-filter-wrap', 2, "State/Province");

      //
      // if (showAccountsTable === true) {
      //   // if showing table
      //   // map the accounts and add them to the table
      //   $.each(data.result.stores, function(index, store) {
      //     // console.log(store);
      //
      //     drawStoreToTable(store);
      //     // addStoreToTable(store);
      //
      //     // get address and add to map
      //     // if showing both map and table
      //     if (showStoresMap === true) {
      //       mapStore(store);
      //     }
      //   });
      //   storesTable.draw();
      // } else if (showStoresMap === true) {
      //   // if showing only map
      //   mapStore(store);
      // }
      //
      // // hide the distance column
      // // storesTable.column(4).visible(false);
      //
      // // create country filter
      // createSelectFilter('#country-filter-wrap', 3, "Country");
      //
      // // create state filter
      // createSelectFilter('#state-filter-wrap', 2, "State/Province");
      //
      // // console.log(data);
    });
  }

  // builds the account row for the accounts table
  function buildAccountRow(account) {
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
    row += '<td><strong>Web Link<strong></td>';
    if (account.fl_weblink != null && account.fl_weblink.length > 10) {fl_pc += '<tr><td><strong>Web Link<strong></td><td><a href=\'' + ensureHttpInUrl(account.fl_weblink) + '\' target=\'_blank\'>web link</a></td><td></td></tr>';} else {fl_pc += '<tr><td><strong>Web Link<strong></td><td>None</td></tr>';}
    fl_pc += "</table>";


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
    if (account.full_address != null) {row += '<td>' + account.full_address + '</td>';} else {row += '<td></td>';}
    if (account.state != null) {row += '<td>' + account.state + '</td>';} else {row += '<td></td>';}
    if (account.country != null) {row += '<td>' + account.country + '</td>';} else {row += '<td></td>';}
    if (account.website != null && account.website.indexOf("http") > -1) {row += '<td><a href="' + account.website + '" target="_blank">website</a></td>';} else {row += '<td></td>';}
    if (account.phone != null) {row += '<td>' + account.phone + '</td>';} else {row += '<td></td>';}
    row += '<td><a type="button" class="pricing-popover" data-trigger="click" data-html="true" data-placement="left" data-toggle="popover" title="FastFerment Pricing" data-content="' + ff_pc + '">Pricing</a></td>';
    row += '<td><a type="button" class="pricing-popover" data-trigger="click" data-html="true" data-placement="left" data-toggle="popover" title="FastFerment Starter Kit Pricing" data-content="' + ff_sk_pc + '">Pricing</a></td>';
    row += '<td><a type="button" class="pricing-popover" data-trigger="click" data-html="true" data-placement="left" data-toggle="popover" title="FastRack Pricing" data-content="' + fr_pc + '">Pricing</a></td>';
    row += '<td><a type="button" class="pricing-popover" data-trigger="click" data-html="true" data-placement="left" data-toggle="popover" title="FastLabel Pricing" data-content="' + fl_pc + '">Pricing</a></td>';
    if (account.fr_speed_challenge_date != null) {row += '<td>' + account.fr_speed_challenge_date + '</td>';} else {row += '<td></td>';}
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

  // get stores json from external url
  function getStores(url, showStoresMap, showStoresTable) {
    showStoresMap = typeof showStoresMap !== 'undefined' ? showStoresMap : false;
    showStoresTable = typeof showStoresTable !== 'undefined' ? showStoresTable : false;

    // ajax
    $.getJSON(url, function( data ) {

      globalStores = data.result.stores;

      // build the table headers for each product
      $.each(data.result.inventories, function(index, product) {
        $('#stores-table thead tr').append('<th>' + product.name + '</th>');
      });

      // make the table a datatable
      storesTable = $('#stores-table').DataTable({
        paging: false,
        info: false,
        fixedHeader: true
      });




      if (showStoresTable === true) {
        // if showing table
        // map the stores and add them to the table
        $.each(data.result.stores, function(index, store) {
          // console.log(store);

          drawStoreToTable(store);
          // addStoreToTable(store);

          // get address and add to map
          // if showing both map and table
          if (showStoresMap === true) {
            mapStore(store);
          }
        });
        storesTable.draw();
      } else if (showStoresMap === true) {
        // if showing only map
        mapStore(store);
      }

      // hide the distance column
      // storesTable.column(4).visible(false);

      // create country filter
      // createSelectFilter('#country-filter-wrap', 3, "Country");

      // create state filter
      // createSelectFilter('#state-filter-wrap', 2, "State/Province");

      // console.log(data);
    });
  }

  // users datatables
  function drawStoreToTable (store) {
    var store_array = [
      // '<img src="' + store.photo + '" />',
      '<a href="/retailers-and-wholesalers-buy/store-details?store_id=' + store.id + '" target="_blank">' + store.store_name + '</a>',
      store.address,
      store.state,
      store.country,
    ];

    if (store.website) {
      store_array.push('<a href="' + store.website + '" target="_blank">website</a>');
    } else {
      store_array.push(null)
    }

    $.each(store.inventories, function(index, inv) {
      store_array.push(inv.inventory);
    });

    // console.log(store_array);
    storesTable.row.add(store_array); //.draw();
  }

  // build the row and add the store to the table. doesnt use datatables
  function addStoreToTable (store) {
    row = "";
    row += '<tr>';
    // if (store.photo) {row += '<img src="' + store.photo + '" />';}
    if (store.store_name) {row += '<td><a href="/retailers-and-wholesalers-buy/store-details?store_id=' + store.id + '" target="_blank">' + store.store_name + '</a></td>';} else {row += '<td></td>';}
    if (store.address) {row += '<td>' + store.address + '</td>';} else {row += '<td></td>';}
    if (store.state) {row += '<td>' + store.state + '</td>';} else {row += '<td></td>';}
    if (store.country) {row += '<td>' + store.country + '</td>';} else {row += '<td></td>';}
    // row += '<td id="distance-store-' + store.id + '"></td>'; // for distance
    //if (store.phone) {row += '<td>' + store.phone + '</td>';} else {row += '<td></td>';}
    if (store.website) {row += '<td><a href="' + store.website + '" target="_blank">website</a></td>';} else {row += '<td></td>';}
    //if (store.email) {row += '<td><a href="mailto:' + store.email + '">' + store.email + '</a></td>';} else {row += '<td></td>';}
    // add where the store has the product
    $.each(store.inventories, function(index, inv) {
      if (inv.inventory) {
        row += '<td>' + inv.inventory + '</td>';
      } else {
        row += '<td></td>';
      }
    });
    row += '</tr>';
    $('#stores-table tbody').append(row);
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

  // place the store on the map
  function mapStore (store) {
    // build the popup
    popup = '<div class="map-popup">';
    if (store.photo) {popup += '<div class="col-xs-5"><img src="' + store.photo + '" class="img-responsive store-photo" /></div><div class="col-xs-7">';}
    // //if (store.store_name) {row += '<td>store.store_name + '</a></td>';} else {row += '<td></td>';}
    if (store.store_name) {popup += '<h3><a href="/retailers-and-wholesalers-buy/store-details?store_id=' + store.id + '" target="_blank">' + store.store_name + '</a></h3>';}
    if (store.full_address) {popup += '<p>' + store.full_address + '</p>';}
    if (store.phone) {popup += '<p>' + store.phone + '</p>';}
    if (store.website) {popup += '<p><a href="' + store.website + '" target="_blank">website</a></p>';}
    if (store.email) {popup += '<p><a href="mailto:' + store.email + '">' + store.email + '</a></p>';}
    if (store.inventories.length > 1) {
      popup += '<table class="table"><thead><tr><th>Product</th><th>Price</th></tr></thead><tbody>';
      $.each(store.inventories, function (index, product) {
        var inv_to_s;
        product.inventory ? inv_to_s = product.inventory : inv_to_s = "";
        popup += '<tr><td>' + product.name + '</td><td>' + inv_to_s + '</td></tr>';
      });
      popup += '</tbody></table>';
    }
    if (store.photo) {popup += '</div>'};
    popup += '</div>';

    // add marker
    storesMap.addMarker({
      lat: store.latitude,
      lng: store.longitude,
      infoWindow: {
        content: popup
      }
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
    popup += '<a class="pricing-popover" onclick="goScroll(\'account-' + account.id + '\');">Pricing</a>'
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

  // store finder submit listener
  $('#filter-submit').on('click', function () {
    console.log('submit clicked');
    address = $('#filter-code').val();

    // show the table
    $('#stores-table_wrapper').show();

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

      // redraw the stores table
      var latitude_to_s = location.lat.toString().replace('.', ',');
      var longitude_to_s = location.lng.toString().replace('.', ',');

      var stores_location_production_url = 'http://fastbrewing-production.herokuapp.com/stores/map/near/' + latitude_to_s + '/' + longitude_to_s;
      var stores_location_staging_url = 'http://fastbrewing-staging.herokuapp.com/stores/map/near/' + latitude_to_s + '/' + longitude_to_s;
      var stores_location_development_url = 'http://localhost:3000/stores/map/near/' + latitude_to_s + '/' + longitude_to_s;
      var stores_locations_url = stores_location_development_url;
      console.log(stores_locations_url);

      // for getting store that carry a given product
      var inventory_id = getQueryVariable("inventory_id");
      if (inventory_id > 0) {
        stores_locations_url += ("/inventories/" + inventory_id)
      }

      $.getJSON(stores_locations_url, function (data) {
        // console.log(data);
        // clear the table
        storesTable.clear().draw();

        $.each(data.result.stores, function(index, store) {
          drawStoreToTable(store);
        });
        storesTable.draw();
        // recreate country filter
        createSelectFilter('#country-filter-wrap', 3, "Country");

        // recreate state filter
        createSelectFilter('#state-filter-wrap', 2, "State/Province");
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
  function buildStoreDetails () {
    var store_id = getQueryVariable("store_id");
    // console.log(store_id);

    var store_details_production_url = "http://fastbrewing-production.herokuapp.com/stores/" + store_id + "/details";
    var store_details_staging_url = "http://fastbrewing-staging.herokuapp.com/stores/" + store_id + "/details";
    var store_details_development_url = "http://localhost:3000/stores/" + store_id + "/details";
    var url = store_details_development_url;
    console.log(url);

    $.getJSON(url, function(store) {
      // console.log(store);
      if (store.result.photo) {
        $('.store-photo-wrap').html('<img src="' + store.result.photo + '" class="img-reponsive"/>');
      }
      $('.store-name').html(store.result.store_name);
      $('.store-address').html(store.result.address);
      $('.store-state-country').html(store.result.state + ", " + store.result.country);
      $('.store-website').html('<a href="' + store.result.website + '" target="_blank">website</a>');
      $('.store-phone').html(store.result.phone);
      $('.store-email').html('<a href="mailto:' + store.result.email + '">' + store.result.email + '</a>');

      $.each(store.result.inventories, function(index, inventory) {
        var inv_to_s;
        inventory.inventory ? inv_to_s = inventory.inventory : inv_to_s = "";
        // var inv_string = inventory.inventory;
        $('.store-products-table tbody').append('<tr><td>' + inventory.name + '</td><td>' + inv_to_s + '</td></tr>');
      });

      if (store.result.latitude > 0) {
        storeMap = new GMaps({
          div: '#store-map',
          lat: store.result.latitude,
          lng: store.result.longitude
        });

        storeMap.addMarker({
          lat: store.result.latitude,
          lng: store.result.longitude
        });
      } else {
        console.log(store.result.latitude);
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
