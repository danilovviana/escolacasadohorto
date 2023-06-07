<?php
if($_POST)
{
	$to_email = "contato@escolacasadohorto.com.br"; 
	
	
    if(!isset($_SERVER['HTTP_X_REQUESTED_WITH']) AND strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) != 'xmlhttprequest') {
		
		$output = json_encode(array( 
			'type'=>'error', 
			'text' => 'Pedimos de desculpas, já vamos resolver'
		));
		die($output); 
    } 
	
	$user_name		= filter_var($_POST["user_name"],);
	$user_email		= filter_var($_POST["user_email"], FILTER_SANITIZE_EMAIL);
	$subject		= filter_var($_POST["subject"],);
	$message		= filter_var($_POST["msg"],);
	
	
	$message_body = $message."\r\n\r\n-".$user_name."\r\nEmail : ".$user_email;
	
	
	$headers = 'From: '.$user_name.'' . "\r\n" .
	'Reply-To: '.$user_email.'' . "\r\n" .
	'X-Mailer: PHP/' . phpversion();
	
	$send_mail = mail($to_email, $subject, $message_body, $headers);
	
	if(!$send_mail)
	{
		
		$output = json_encode(array('type'=>'error', 'text' => '<p>Não foi possível enviar e-mail! Por favor, verifique sua configuração de e-mail do PHP.</p>'));
		die($output);
	}else{
		
		$output = json_encode(array('type'=>'message', 'text' => '<div class="alert alert-success" role="alert">
		Hi '.$user_name .', Obrigado pela sua mensagem. Entraremos em contato em breve.</div>'));
		die($output);
	}
}
?>