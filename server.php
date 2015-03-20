<?php
require_once("settings.php"); //Get Instagram client id

header("Content-type: application/json"); //We're displaying some json here, not plain text/html

/**
 * @param $code whatever error code (http response) we want
 * to display in our meta object
 */
function errorCode($code) {
    $erray['meta']['code'] = $code;
    $erray = json_encode($erray);
    print_r($erray);
}

if (isset($_GET['tag']) && isset($_GET['url'])) {
    if ($_GET['tag'] == "") {
        errorCode(411); //Not acceptable - empty tag parameter
        exit;
    } else if (preg_match('/\s/', $_GET['tag']) || preg_match('/%20/', $_GET['tag'])) {
        errorCode(406); //Bad request - found a space
        exit;
    } else {
        if ($_GET['url'] != "first") { //if url is anything other than first, we put it in our API call
            $nextUrl = "&max_tag_id=" . $_GET['url'];
        } else {
            $nextUrl = "";
        }
        $searchFor = $_GET['tag']; //Our tag or location to search for
        if ($_GET['loc'] == "true") {
            $coordsjson = file_get_contents("https://maps.googleapis.com/maps/api/geocode/json?address=" . $searchFor);
            $coordsdata = json_decode($coordsjson, true); //Turn the returned json into an array we can easily get info from
            $loclat = $coordsdata['results'][0]['geometry']['location']['lat']; //Get latitude (and longitude) from the first/best result
            $loclng = $coordsdata['results'][0]['geometry']['location']['lng'];
            $searchFor = "?lat=" . $loclat . "&lng=" . $loclng . "&distance=2500"; //Build our area information, only search within 2.5km radius
            $newArray['meta']['lat'] = $loclat;
            $newArray['meta']['lng'] = $loclng;
            $json = file_get_contents("https://api.instagram.com/v1/media/search" . $searchFor . "&client_id=" . CLIENT_ID); //Search at location
        } else {
            $json = file_get_contents("https://api.instagram.com/v1/tags/" . $searchFor . "/media/recent?client_id=" . CLIENT_ID . $nextUrl); //Search for recent tag uses
        }
        $data = json_decode($json, true); //Turn the Instagram API json into an array
        $newArray['meta']['code'] = 200; //Yay
        if ($_GET['loc'] == "false") { //Location based calls give 20 results and no next tag id
            $newArray['meta']['next'] = $data['pagination']['next_max_tag_id']; //Return the next tag id so our jquery can make the next call
        }
        $i = 0;
        foreach ($data['data'] as $image) { //Loop through all results from the Instagram API call
            if (!empty($image['location']['latitude'])) { //Only return results with a location
                $newArray['data'][$i]['full'] = $image['images']['low_resolution']['url'];
                $newArray['data'][$i]['thumb'] = $image['images']['thumbnail']['url'];
                $newArray['data'][$i]['desc'] = $image['caption']['text'];
                $newArray['data'][$i]['lat'] = $image['location']['latitude'];
                $newArray['data'][$i]['long'] = $image['location']['longitude'];
                $newArray['data'][$i]['link'] = $image['link'];
                $newArray['data'][$i]['likes'] = $image['likes']['count'];
                $newArray['data'][$i]['comments'] = $image['comments']['count'];
                $newArray['data'][$i]['usercount'] = count($image['users_in_photo']);
                $newArray['data'][$i]['tagcount'] = count($image['tags']);
                $i++;
            }
        }

        $newJson = json_encode($newArray); //Encode our newly created array into json
        print_r($newJson); //Woo
    }
} else {
    errorCode(400); //Bad request - no tag parameter
    exit;
}
?>