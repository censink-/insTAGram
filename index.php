<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="assets/css/bootstrap.min.css"/>
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
<div id="map-canvas"><!-- Filled by Maps api -->
</div>
<div class="sidebar">
    <div class="sidebar-tab">
        <i id="arrow" class="glyphicon glyphicon-chevron-left"></i>
    </div>
    <h1>InsTAGram</h1>
    <hr>
    <form id="tagform" class="form-inline">
        <input id="tag" type="text" class="form-control" placeholder="Type Something :D" required>
        <p>
        <div class="btn-group">
            <a class="btn btn-primary" id="tagsubmit" data-loading-text="Searching..."><i class="glyphicon glyphicon-tags"></i> Tag</a>
            <a class="btn btn-primary" id="locsubmit" data-loading-text="Searching..."><i class="glyphicon glyphicon-map-marker"></i> Location</a>
        </div>
    </form>
    <hr>
    <p id="count"><span class="label label-danger">0</span> Results</p>
</div>
<script src="assets/js/jquery.js"></script>
<script src="assets/js/bootstrap.min.js"></script>
<script src="https://maps.googleapis.com/maps/api/js"></script>
<script src="assets/js/main.js"></script>
<script>
    $(function () {
        $('[data-toggle="tooltip"]').tooltip();
        $('[data-toggle="popover"]').popover();
    })
</script>
</body>
</html>