document.addEventListener("DOMContentLoaded", function() {

  /* HTML5 History API normalization */

  var initialUrl = location.href,
      queryURL = window.location.search,
      historyCanary = false;

  window.addEventListener("popstate", function() {
    var fauxPop = !historyCanary && location.href === initialURL;
        historyCanary = true;

    if (fauxPop) return;
    else {
      $("#landing-page").toggleClass("off-canvas");
      $("#search-page").toggleClass("off-canvas");
    }
  });

  var searchFromURL = function searchFromURL(queryURL) {
    var matchQueryOnly = /^\?q=(.+)/,
        decoded = decodeURIComponent(queryURL.replace(/\+/g, " ")),
        query = matchQueryOnly.exec(decoded)[1];

    $("#search-input").val(query);
    toggleSearchPage();
    renderResults(query);
  }


  /* Cask data */

  var caskList,
      caskSpanId = "n-cask",
      contribSpanId = "n-contrib";

  var contribHandler = function contribHandler(data, textStatus, jqXHR) {
    var links = jqXHR.getResponseHeader("Link"),
        pageCount = links.match(/&page=(\d+)>; rel="last"/).pop();

    $("#" + contribSpanId).fadeOut(250, function() {
      $(this).text(pageCount).fadeIn(250);
    });
  }

  var commitHandler = function commitHandler(data) {
    var latestTree = "https://api.github.com/repos/caskroom/homebrew-cask/git/trees/"
                   + data[0].sha
                   + "?recursive=1";

    request(latestTree, caskHandler);
  }

  var caskHandler = function caskHandler(data) {
    caskList = process(data);

    $("#" + caskSpanId).fadeOut(250, function() {
      $(this).text(caskList.length.toString()).fadeIn(250);
    });

    if (queryURL) searchFromURL(queryURL);
  }

  var request = function request(url, handler) {
    $.ajax({
      url: url,
      type: "GET",
      success: function(data, textStatus, jqXHR) {
        handler(data, textStatus, jqXHR);
      }
    });
  }

  request("https://api.github.com/repos/caskroom/homebrew-cask/commits?per_page=1", commitHandler);
  request("https://api.github.com/repos/caskroom/homebrew-cask/contributors?per_page=1", contribHandler);


  /* Search */

  var process = function process(data) {
    var isCaskFile = function(el) {
      var r = /^Casks\/.+\.rb/;

      return r.test(el.path);
    };
    var toEntry = function(el, i) {
      var r = /^Casks\/(.+).rb/,
          caskFileName = r.exec(el.path)[1];

      return {
        id: i,
        caskName: caskFileName,
        appName: caskFileName.replace(/-/g, " "),
        entryName: caskFileName.replace(/[^A-Za-z0-9]/g, ""),
        caskUrl: el.url
      };
    };

    var casks = data.tree.filter(isCaskFile).map(toEntry);

    return casks;
  };

  var searchTemplate = $("#search-template").html(),
      promptSearchTemplate =  $("#prompt-search-template").html(),
      render = doT.template(searchTemplate);

  var search = function search(q) {
    var queryString = q.replace(/[^A-Za-z0-9]/g, ""),
        regexp = new RegExp(queryString);

    var results = caskList.filter(function(el) {
      return regexp.test(el.entryName);
    })

    return results;
  }

  var renderResults = function renderResults(q) {
    var results = search(q);

    $("#search-view").html(render(results));
  }

  /* Search Page*/

  var toggleSearchPage = function toggleSearchPage() {
    history.pushState(null, null, null);
    historyCanary = true;

    $("html, body").animate({ scrollTop: 0 }, 250).promise().done(function() {
      $("#landing-page").toggleClass("off-canvas");
      $("#search-page").toggleClass("off-canvas");
    });
  }

  $("#search-button").on("click", function(e) {
    toggleSearchPage();

    $("#search-input").focus();
    e.preventDefault();
  });

  var debounce = function debounce(fn) {
    var timeout;

    return function () {
      var args = Array.prototype.slice.call(arguments),
          ctx = this;

      clearTimeout(timeout);
      timeout = setTimeout(function () {
        fn.apply(ctx, args);
      }, 200);
    };
  };

  $("#search-input").on("keyup", debounce(function() {
    var fieldedQuery = $(this).val()

    if (fieldedQuery < 1) $("#search-view").html(doT.template(promptSearchTemplate));
    else renderResults(fieldedQuery)
  }));

  $("#search-input").on("keyup keypress", function(e) {
    var key = e.keyCode || e.which;

    if (key  === 13) {
      e.preventDefault();
      return false;
    }
  });
});
