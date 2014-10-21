<?php
	// GLOBAL vars. Get the domain name:
	$SERVERNAME = $_SERVER['SERVER_NAME'];  
	$SITENAME = 'SIMPLIFY.THATSH.IT';
	$DESCRIPTION = "http://simplify.thatsh.it creates modern art by simplifying images to their core elements. #SimplifyThatShit";
	$KEYWORDS = "SIMPLIFY.THATSH.IT simplify that shit canvas html5 abstraction art tim nolan jen lu";
	$JSFOLDER = "js";

	if(strpos($_SERVER['HTTP_HOST'],'local') !== false) $JSFOLDER = "js-dev"; else $JSFOLDER = "js";
?>

<!doctype html>
<!--[if lt IE 7 ]>
  <html lang="en" class="ie ie6">
<![endif]-->
<!--[if IE 7 ]>
  <html lang="en" class="ie ie7">
<![endif]-->
<!--[if IE 8 ]>
  <html lang="en" class="ie ie8">
<![endif]-->
<!--[if IE 9 ]>
  <html lang="en" class="ie ie9">
<![endif]-->
<!--[if (gt IE 9)|!(IE)]><!-->
  <html lang="en">
<!--<![endif]-->
<head>
	<meta charset="UTF-8">
	<link rel="shortcut icon" href="assets/imgs/favicon.ico">
	<meta http-equiv="cleartype" content="on"></meta>
	<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1"></meta>
	<!-- Styles -->
	<link rel="stylesheet" data-type="globalcss" type="text/css" href="assets/css/global.css">
	<meta name="viewport" content="user-scalable=no, width=device-width, initial-scale=1, maximum-scale=1">
	
<!-- SEO -->
	<title><?php echo $SITENAME; ?></title>
	<!-- Content Meta -->
	<meta name="description" content="<?php echo $DESCRIPTION;?>">
	<meta name="keywords" content="<?php echo $KEYWORDS ?>">
	<!-- Share Meta -->
	<meta property="fb:app_id" content="">
	<meta property="og:type" content="website">
	<meta property="og:site_name" content="<?php echo $SITENAME; ?>">
	<meta property="og:description" content="<?php echo $DESCRIPTION;?>">
	<meta property="og:url" content="http://<?php echo $SERVERNAME;?>">
	<meta property="og:title" content="<?php echo $SITENAME;?>">
	
	<?php
		// randomize the share images (no promise this will work consistently),
		// Facebook does a lot of caching on the meta tags.
		$imgs = array("thumb1.jpg","thumb2.jpg","thumb3.jpg","thumb4.jpg","thumb5.jpg","thumb6.jpg"); 
		$maxImgsToShow = 3;
		shuffle($imgs);
		for($i=0; $i < $maxImgsToShow; $i++){
			echo '<meta property="og:image" content="http://'.$SERVERNAME.'/assets/imgs/share/'.$imgs[$i].'"> ';
		}
	?>
<!-- End SEO -->
</head>
<body>
	
	<div class="top full-width-bar"></div>
	
	<div class="header">
		<div class="logo">SIMPLIFY.THATSH.IT</div>
		<p>
			Create modern art by simplifying images to their core elements.<br/>
			The output is a geometric composition derived from original image’s color and composition data.
		</p>
	</div>

	<div class="app wrapper">
		<div id="simplifyapp" class="empty">
			<canvas id="origin-canvas"></canvas>
			<canvas id="visible-canvas"></canvas>
		</div>
	</div>

	<div class="export-wrapper" >
		<a id="export-btn">DOWNLOAD THAT SHIT</a>
	</div>


	<div id="banner-bar" >
		<div class="artist-statement">Artist Statement</div>
		<p>
			Simplify That Shit represents the collaboration between two human artists and computer based image algorithms to create a simplified aesthetic art form. The exhibit features a limited edition series of hand screened prints created by <a class="jen" href="http://twitter.com/jendotlu" taregt="_blank">Jen Lu</a> and <a class="tim" href="http://twitter.com/tim_nolan" target="_blank">Tim Nolan</a> as well as a short run of wearable art and a single channel video installation.
		</p>
		<p>
			As a recurring theme of the artists’ work, this application further explores possibility of human and machine creativity working in tandem. Using a curated collection of hIgh fidelity images from the artists are fed into the computer application that uses web based technologies to inspect and reduce, and reinterpret the images based on their core values of color and layout and interprets them into geometric compositions. Unlike their previous works, the human hand executes the final exhibited product.
		</p>

	</div>

	<div class="gallery-wrapper">
		<p>A limited edition of prints and wearables are available in our <a href="http://universalscene.bigcartel.com/" target="_blank">webstore</a>.</p>
		<ul>
			<li><a href="#" target="_blank">
				<div class="img" style="background-image:url(renders/vang.jpg);"></div>
				<h3>VAN GOGH</h3>
				<h4>The Sorry Night</h4>
				<p>
					22”x30”<br/>
					Printed on Stonehenge by the artists<br/>
					Edition of 5<br/>
				</p>
			</a></li>
			<li><a href="#" target="_blank">
				<div class="img" style="background-image:url(renders/mondrian.jpg);"></div>
				<h3>MONDRIAN</h3>
				<h4>Composition C (No.III) with E50011,<br/>F6C526 and 000048</h4>
				<p>
					22”x30”<br/>
					Printed on Stonehenge by the artists<br/>
					Edition of 5<br/>
				</p>
			</a></li>
			<li><a href="#" target="_blank">
				<div class="img" style="background-image:url(renders/groening.jpg);"></div>
				<h3>GROENING</h3>
				<h4>Simpsons Couch Gag</h4>
				<p>
					22”x30”<br/>
					Printed on Stonehenge by the artists<br/>
					Edition of 5<br/>
				</p>
			</a></li>
			<li><a href="#" target="_blank">
				<div class="img" style="background-image:url(renders/rothko.jpg);"></div>
				<h3>ROTHKO</h3>
				<h4>Untitled No. 18</h4>
				<p>
					Printed by the artists<br/>
					Edition of 12<br/>
				</p>
			</a></li>
			<li><a href="#" target="_blank">
				<div class="img" style="background-image:url(renders/chanel.jpg);"></div>
				<h3>CHANEL</h3>
				<h4>Logo</h4>
				<p>
					Printed by the artists<br/>
					Edition of 12<br/>
				</p>
			</a></li>
			<li><a href="#" target="_blank">
				<div class="img" style="background-image:url(renders/miro.jpg);"></div>
				<h3>MIRO</h3>
				<h4>Bleu 2.0</h4>
				<p>
					Printed by the artists<br/>
					Edition of 12<br/>
				</p>
			</a></li>
		</ul>
	</div>
	
	<div class="footer">
		<div class="footer-content">
			<a class="universal" target="_blank" href="http://universalscene.co/"></a>
			<a class="huge" href="http://hugeinc.com/" target="_blank"></a>
			<a class="site" target="_blank" href="http://thatsh.it/"></a>
			<a class="email" target="_blank" href="mailto:get@thatsh.it" ></a>
		</div>
	</div>

	<div class="overlay">
		<div class="modial">
			<p class="nodraganddrop" >
				You can not drag files on a touch device. Use a desktop computer to drag and drop your own images.
			</p>
			<div class="cta-ok btn">OK</div>
		</div>
	</div>

	<!-- Scripts -->
	<script>
		var dev = false;
		
		if( window.location.origin.search("local") >= 0 ||
			window.location.origin.search("dev") >= 0 ){
			dev = true;
		}

		// cycle image list for touchscreens devices:
		var imgList = [
			"imglist/bart.png",     
			"imglist/CampbellsSoupIChickenNoodle.jpg",
			"imglist/condo.jpg",
			"imglist/duchamp.jpg",
			"imglist/gucci-logo.jpg",
			"imglist/icecreampixel.jpg",
			"imglist/koons.jpg",
			"imglist/paint.jpg",
			"imglist/sailormoon.jpg",
			"imglist/sponge.jpg",
		];

		function getRequirePath() {
			// if( dev == true ){
			//     return 'assets/js-dev/'
			// }else{
			//     return 'assets/js/'
			// }
			return <?php echo '"assets/'.$JSFOLDER.'"'; ?>;
		}

		// in dev mode : or make this a debug module 
		// window.trace = window.trace || function(str){ console.log( str ) };
		window.trace = function(str){
		  if( dev == true ){
			console.log(str);
		  }
		}
	</script>
	
	<script data-main="assets/<?php echo $JSFOLDER;?>/App" src="assets/<?php echo $JSFOLDER ?>/_lib/require.js"></script>
	
</body>
</html>
