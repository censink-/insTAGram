var map, //Start of empty variables
    tag,
    loc = false,
    count = 0,
    markers = [],
    previews = [],
    windows = [],
    sidebar = 0, //End of empty variables
    limit = 50; //Amount of tag-specific results to fetch

$(init); //Run the init function as the page finishes loading

/**
 * Ran on page load, initiates key features on the page
 */
function init() {
    loadMap(); //Load the map
    flashSidebar("show"); //Let the user know there's a panel hiding on the right
    $('#tagform').on('submit', submit); //Catch for submits, defaults to tag submits
    $('#locsubmit').on('click', locSubmit); //Change to location submit
    $('#tagsubmit').on('click', tagSubmit); //Change (back) to tag submit
    $('.sidebar-tab').on('click', toggleSidebar); //Handle the click to open and close the sidebar
}

/**
 * Load the google map with some adjustments
 */
function loadMap() {
    var myCenter = new google.maps.LatLng(25,0);

    var mapProp = {
        center: myCenter,
        zoom: 2,
        mapTypeId: google.maps.MapTypeId.SATELLITE
    };

    map = new google.maps.Map(document.getElementById("map-canvas"), mapProp);
}

/**
 * Initiate (and stop) the glowing on the sidebar's tab
 * @param action = either show or hide
 * Anything other than show will terminate the flashing effect.
 * As we're using jquery's toggleClass to set and remove the
 * css 'flash' class, we make sure to remove the class when
 * terminating the loop.
 */
function flashSidebar(action) {
    var tab = $('.sidebar-tab');
    if (action == "show") {
        console.log("starting glow");
        window.flashloop = setInterval(function () {
            tab.toggleClass("flash");
        }, 1000);
        window.doFlash = 1;
    } else {
        console.log("stopping glow");
        clearInterval(window.flashloop);
        tab.removeClass("flash");
        window.doFlash = 0;
    }
}


/**
 * Set the location variable to false before submitting,
 * so the actual submit function will treat it as a tag submit
 */
function tagSubmit() {
    loc = false;
    $('#tagform').submit();
}
/**
 * Set the location variable to true before submitting,
 * so the actual submit fuction will treat it as a location submit
 */
function locSubmit() {
    loc = true;
    $('#tagform').submit();
}

/**
 * Submit the form, and start searching by initiating the tagSearch function
 * @param e = static parameter, used to prevent an actual http form submit
 */
function submit(e) {
    count = 0;

    e.preventDefault();
    tag = $('#tag').val();
    if (tag == "") {
        searchFailure();
    } else {
        if (loc == true) {
            $('#locsubmit').button('loading');
        } else {
            $('#tagsubmit').button('loading');
        }

        for (i = 0; i < markers.length; i++) {
            markers[i].setMap(null);
        }
        markers = [];

        tagSearch(tag, "first");
    }
}

/**
 * Execute an ajax-call to our server.php
 * @param getTag = value from our text input
 * @param nextUrl = either "first" or instagram's max_tag_id
 * * Used for pagination, in this case: fetching more results
 * * Until 50 results were given
 */
function tagSearch(getTag, nextUrl) {
    $.ajax({ //server.php?tag=Drone&url=1426850606131749&loc=false
        dataType: "json",
        url: 'server.php',
        data: {tag: getTag, url: nextUrl, loc: loc},
        success: searchCallback,
        failure: searchFailure
    });
}

/**
 * Executed when data was received
 * @param data = data returned from our ajax call
 */
function searchCallback(data) {
    if (loc == true) {
        console.log("lat:" + data.meta.lat);
        console.log("lng:" + data.meta.lng);
        var locCenter = new google.maps.LatLng(data.meta.lat, data.meta.lng), //The coords relating to the entered location
            locOptions = {
                center: locCenter,
                map: map,
                strokeColor: '#0000FF',
                strokeOpacity: 0.4,
                strokeWeight: 2,
                fillColor: '#0000FF',
                fillOpacity: 0.1,
                radius: 3000
            },
            locMarker = new google.maps.Circle(locOptions); //Add the circle to the map, with some adjustments
        map.setCenter(locCenter); //Go to the circle
        map.setZoom(13); //And zoom in
    }
    $.each(data.data, function(i, result) {
        if (count < limit) {
            console.log("(" + (count + 1) + ") " + result.link);
            var markLoc = new google.maps.LatLng(result.lat, result.long);
            var marker = new google.maps.Marker ({
                position: markLoc,
                icon: 'assets/img/instagram.png',
                map: map,
                animation: google.maps.Animation.DROP
            });

            var preview = new google.maps.InfoWindow ({
                content: "<img src=\"" + result.thumb + "\" alt=\"" + result.link + "\">",
                zIndex: 100
            });

            var window = new google.maps.InfoWindow ({
                content:
                    "<div class=\"text-center\">" +
                        "<span class=\"label label-success\"><i class=\"glyphicon glyphicon-thumbs-up\"></i> " + result.likes + "</span> " +
                        "<span class=\"label label-danger\"><i class=\"glyphicon glyphicon-comment\"></i> " + result.comments + "</span> " +
                        "<a class=\"btn btn-primary\" target=\"_blank\" href=\"" + result.link + "\">Go to post</a> " +
                        "<span class=\"label label-warning\"><i class=\"glyphicon glyphicon-user\"></i> " + result.usercount + "</span> " +
                        "<span class=\"label label-info\"><i class=\"glyphicon glyphicon-tags\"></i> " + result.tagcount + "</span>" +
                    "</div>" +
                    "<hr>" +
                    "<img class=\"img-rounded\" src=\"" + result.full + "\" alt=\"" + result.desc + "\">",
                zIndex: 150 //Make sure this window is displayed ontop of the preview(s)
            });

            google.maps.event.addListener(marker, 'mouseover', function() {preview.open(map,marker)});
            google.maps.event.addListener(marker, 'mouseout', function() {preview.close(map,marker)});
            google.maps.event.addListener(marker, 'click', function() { //Every time a window is opened, we close the others
                for (i = 0; i < windows.length; i++) {
                    windows[i].close(map, marker);
                }
                window.open(map,marker);
            });

            //Add the created marker, preview (thumbnail) and infowindow to their arrays
            markers.push(marker);
            previews.push(preview);
            windows.push(window);

            count++; //Increment our results counter
        }
    });

    /*
     * Chose to put the loop in our frontend, to quickly roll out
     * our first results before moving on to the next API call,
     * also works nicely with the gMaps marker animation
     */
    if (count < limit && loc == false) {
        console.log("Fetching more results from '" + data.meta.next + "'.");
        tagSearch(tag, data.meta.next);
    } else {
        $('.btn-primary').button('reset');
    }

    if (loc) { //Only returns max 20 results
        if (count <= 5) {
            counter = "<span class=\"label label-danger\">" + count + "/20</span>";
        } else if (count > 15) {
            counter = "<span class=\"label label-success\">" + count + "/20</span>";
        } else {
            counter = "<span class=\"label label-warning\">" + count + "/20</span>";
        }
        $('#count').html(counter + " Results in '" + tag + "'"); // X/20 Results in 'Rotterdam'
    } else { //Returns @limit results
        if (count <= 10) {
            counter = "<span class=\"label label-danger\">" + count + "/" + limit + "</span>";
        } else if (count > 40) {
            counter = "<span class=\"label label-success\">" + count + "/" + limit + "</span>";
        } else {
            counter = "<span class=\"label label-warning\">" + count + "/" + limit + "</span>";
        }
        $('#count').html(counter + " Results for tag '" + tag + "'"); // X/50 Results for tag 'Drone'
    }
}

/**
 * Execute this when the api call failed,
 * or when a submit button was clicked with no tag
 */
function searchFailure() {
    $('.btn-primary').button('reset');
    $('#count').html("Something went wrong, make sure you entered 1 word or try again later!");
}

/**
 * Show or hide the sidebar,
 */
function toggleSidebar() {
    if (window.doFlash) {
        flashSidebar("hide"); //Stop flashing the tab
    }
    if (sidebar == 0) {
        $('#tag').focus(); //Automagically 'select' the text input so we can start typing
        sidebar = 1;
    } else {
        sidebar = 0;
    }
    $('#arrow').toggleClass('rotate');
    $('.sidebar').toggleClass('sidebar-shown');
}