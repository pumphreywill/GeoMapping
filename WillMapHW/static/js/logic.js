$(document).ready(function() {
    let fullURL = $('#timeFilter').val();
    makeMap(fullURL, -1);

    $("#timeFilter, #magFilter").change(function() {
        let fullURL = $('#timeFilter').val();
        let minMag = $('#magFilter').val();
        let vizText = $("#timeFilter option:selected").text();
        $('#vizTitle').text(`Earthquakes in the ${vizText}`);
        makeMap(fullURL, minMag);
    });
});

function makeMap(fullURL, minMag) {

    $('#mapParent').empty();
    $('#mapParent').append('<div style="height:700px" id="map"></div>');


    var streetmap = L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
        attribution: "© <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a></strong>",
        tileSize: 512,
        maxZoom: 18,
        zoomOffset: -1,
        id: "mapbox/streets-v11",
        accessToken: API_KEY
    });

    var lightmap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
        attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
        maxZoom: 18,
        id: "light-v10",
        accessToken: API_KEY
    });

    var darkmap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
        attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
        maxZoom: 18,
        id: "dark-v10",
        accessToken: API_KEY
    });

    var satellitemap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
        attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
        maxZoom: 18,
        id: "satellite-streets-v11",
        accessToken: API_KEY
    });


    d3.json(fullURL).then(function(response) {


        var markers = L.markerClusterGroup();
        var heatArray = [];
        var circles = [];

        var earthquakes = response.features;

        earthquakes.forEach(function(earthquake) {
            if ((earthquake.geometry.coordinates[1]) && (earthquake.geometry.coordinates[0])) {
                if (earthquake.properties.mag >= minMag) {

                    let temp = L.marker([+earthquake.geometry.coordinates[1], +earthquake.geometry.coordinates[0]]).bindPopup(`<h4>${earthquake.properties.place}</h4><hr><h5>Mag: ${earthquake.properties.mag}</h5><hr><h5>Time: ${new Date(earthquake.properties.time)}</h5>`);
                    markers.addLayer(temp);


                    heatArray.push([+earthquake.geometry.coordinates[1], +earthquake.geometry.coordinates[0]]);

                    let circle = L.circle([+earthquake.geometry.coordinates[1], +earthquake.geometry.coordinates[0]], {
                        fillOpacity: 0.8,
                        color: "white",
                        fillColor: getCircleColor(earthquake.properties.mag),
                        radius: getMarkerSize(earthquake.properties.mag)
                    }).bindPopup(`<h4>${earthquake.properties.place}</h4><hr><h5>Mag: ${earthquake.properties.mag}</h5><hr><h5>Time: ${new Date(earthquake.properties.time)}</h5>`);

                    circles.push(circle);
                }
            }
        });

        var tectonicPlatesURL = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json"
        d3.json(tectonicPlatesURL).then(function(plates) {
            let plateLayer = L.geoJson(plates, {

                style: function(feature) {
                    return {
                        color: "orange",
                        weight: 1.5
                    };
                }
            });

            var heat = L.heatLayer(heatArray, {
                radius: 60,
                blur: 40
            });

            var circleLayer = L.layerGroup(circles);

            var baseMaps = {
                "Street": streetmap,
                "dark": darkmap,
                "Light": lightmap,
                "Satellite": satellitemap
            };

            var overlayMaps = {
                "Heatmap": heat,
                "Markers": markers,
                "Circles": circleLayer,
                "Tectonic Plates": plateLayer
            };


            var myMap = L.map("map", {
                center: [37.7749, -122.419],
                zoom: 4,
                layers: [darkmap, markers, plateLayer]
            });

            myMap.addLayer(markers);
            L.control.layers(baseMaps, overlayMaps).addTo(myMap);


            var legend = L.control({ position: 'bottomleft' });
            legend.onAdd = function() {
                var div = L.DomUtil.create("div", "info legend");

                div.innerHTML += "<h4>Magnitudes</h4>";
                div.innerHTML += '<i style="background: #98ee00"></i><span>0-1</span><br>';
                div.innerHTML += '<i style="background: #d4ee00"></i><span>1-2</span><br>';
                div.innerHTML += '<i style="background: #eecc00"></i><span>2-3</span><br>';
                div.innerHTML += '<i style="background: #ee9c00"></i><span>3-4</span><br>';
                div.innerHTML += '<i style="background: #ea822c"></i><span>4-5</span><br>';
                div.innerHTML += '<i style="background: #ea2c2c"></i><span>5+</span>';

                return div
            }
            legend.addTo(myMap);
        });
    });
}

function getMarkerSize(mag) {
    let radius = 50000;
    if (mag > 0) {
        radius = mag * 50000;
    }
    return radius;
}

function getCircleColor(mag) {
    let color = "";
    if (mag >= 5) {
        color = "#ea2c2c";
    } else if (mag >= 4) {
        color = "#ea822c";
    } else if (mag >= 3) {
        color = "#ee9c00";
    } else if (mag >= 2) {
        color = "#eecc00";
    } else if (mag >= 1) {
        color = "#d4ee00";
    } else {
        color = "#98ee00";
    }

    return color;
}