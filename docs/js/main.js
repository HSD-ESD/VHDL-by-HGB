/* global bootstrap: false */
(() => {
    'use strict'
    const tooltipTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    tooltipTriggerList.forEach(tooltipTriggerEl => {
      new bootstrap.Tooltip(tooltipTriggerEl)
    })
  })()
  

  function gotoFeatures() {
    // Überprüfe, ob die aktuelle Seite in einem Unterordner liegt
    var isSubfolder = window.location.pathname.split('/').length > 2;

    // Basis-URL je nach Kontext
    var baseUrl = isSubfolder ? '/sites' : '';

    // Der Rest des Links
    var restOfLink = '/features.html';

    // Den vollständigen Link erstellen
    var dynamicLink = baseUrl + restOfLink;

    // Seite öffnen
    open(dynamicLink, "_self");
  }