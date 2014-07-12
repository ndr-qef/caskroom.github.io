document.addEventListener("DOMContentLoaded", function() {

  /* HTML5 History API normalization */

  var initialUrl = location.href,
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

  var caskHandler = function caskHandler(data) {
    $("#" + caskSpanId).fadeOut(250, function() {
      $(this).text(data.length.toString()).fadeIn(250);
    });

    process(data);
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

  request("https://api.github.com/repos/caskroom/homebrew-cask/contents/Casks", caskHandler);
  request("https://api.github.com/repos/caskroom/homebrew-cask/contributors?per_page=1", contribHandler);

  /* Search */

  var process = function process(data) {
    caskList = data.map(function(res, i) {
      var raw = res.name.substr(0, res.name.lastIndexOf(".")) || res.name;

      return {
        id: i,
        caskName: raw,
        appName: raw.replace(/-/g, " "),
        entryName: raw.replace(/[^A-Za-z0-9]/g, ""),
        caskUrl: res.html_url
      };
    });
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

  $("#search-button").on("click", function(e) {
    history.pushState(null, null, "/search");
    historyCanary = true;

    $("html, body").animate({ scrollTop: 0 }, 250).promise().done(function() {
      $("#landing-page").toggleClass("off-canvas");
      $("#search-page").toggleClass("off-canvas");
    });

    $("#search-input").focus();
    e.preventDefault();
  });

  $("#search-input").on("keyup", debounce(function() {
    var fieldedQuery = $(this).val()

    if (fieldedQuery < 1) $("#search-view").html(doT.template(promptSearchTemplate));
    else {
      var results = search(fieldedQuery);

      $("#search-view").html(render(results));
    }
  }));

  $("#search-input").on("keyup keypress", function(e) {
    var key = e.keyCode || e.which;

    if (key  === 13) {
      e.preventDefault();
      return false;
    }
  });
});
