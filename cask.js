document.addEventListener('DOMContentLoaded', function() {

    function request(url, spanId) {
        $.ajax({
            url: url,
            type: "GET",
        success: function(data) {
              $('#' + spanId).fadeOut(250, function() {
                  $(this).text(data.length.toString()).fadeIn(250);
              });
          }
        });
    }

    request("https://api.github.com/repos/phinze/homebrew-cask/contents/Casks",
          "n-cask");
  
    request("https://api.github.com/repos/phinze/homebrew-cask/contributors",
          "n-contrib");
})