// Contact form

$("#submit_btn").on("click", function() {

    var proceed = true;

    $("#contact_form input[required], #contact_form textarea[required]").each(function() {
        $(this).css('border-color', '');
        if (!$.trim($(this).val())) {
            $(this).css('border-color', '#e44747');
            $("#contact_results").html('<br><div class="alert alert-danger">Please fill out the required fields.</div>').show();

            proceed = false;
        }

        var email_reg = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
        if ($(this).attr("type") === "email" && !email_reg.test($.trim($(this).val()))) {
            $(this).css('border-color', '#e44747');
            $("#contact_results").html('<br><div class="alert alert-danger">Please enter a valid email address.</div>').show();
            proceed = false;
        }
    });

    if (proceed) {

        var post_data = {
            'user_name': $('input[name=name]').val(),
            'user_email': $('input[name=email]').val(),
            'subject': $('input[name=subject]').val(),
            'msg': $('textarea[name=message]').val()
        };


        $.post('php/sendmail.php', post_data, function(response) {
            if (response.type === 'error') {
                var output = '<br><div class="alert">' + response.text + '</div>';
            } else {
                var output = '<br><div class="success">' + response.text + '</div>';
                $("#contact_form input, #contact_form textarea").val('');

            }
            $('html, body').animate({ scrollTop: $("#contact_form").offset().top - 50 }, 2000);

            $("#contact_results").hide().html(output).slideDown();
        }, 'json');
    }
});

$("#contact_form  input[required=true], #contact_form textarea[required=true]").keyup(function() {
    $(this).css('background-color', '');
    $("#result").slideUp();
});