var layoutStorage = {

	config: {
		color: 'white',
		use_noti: true,
		use_noti_best: true,
		log_readed_log: true,
		update: 20170324, // 나중에 기본 설정값이 변경(추가, 삭제)되었을 때 회원들의 설정 동기화용.
		document_list: []
	},

	checkStorage: function() {
		if(typeof(localStorage) == 'undefined') {
			return false;
		} else {
			return true;
		}
	},

	initStorage: function(){
		if(typeof(localStorage) == 'undefined') {
			return false;
		}

		localStorage.setItem("layoutConfig", escape(JSON.stringify(this.config)));
		return true;
	},

	getData: function(){
		if(!this.checkStorage()){
			return false;
		}
		var data = localStorage.getItem("layoutConfig");
		if(!data){
			var init = this.initStorage();
			if(!init) {
				return false;
			}

			data = this.config;
		} else {
			data = JSON.parse(unescape(data));
			if(data.update != this.config.update) {
				var init = this.initStorage();
				if(!init) {
					return false;
				}

				data = this.config;
			}
		}

		return data;
	},

	addDocument: function(document_srl, title){
		var max_document_count = 50;

		var config = this.getData();
		if(!config) {
			this.initStorage();
			config = this.getData();
			if(!config){
				return false;
			}
		}
		if(!document_srl) {
			return false;
		}

		var date = new Date().getTime();
		if(!title) {
			title = 'Untitle';
		}

		if(title.length > 30) {
			title = title.substring(0, 30) + " ...";
		}

		var doc_len = config.document_list.length;
		var remove_index = [];
		max_document_count -= 1;
		for(var i=0; i<doc_len; i++) {
			if( doc_len-remove_index.length >= max_document_count ||
				config.document_list[i].document_srl == document_srl
			) {
				remove_index.push(i);
				continue;
			}
		}

		var remove_index_len = remove_index.length;
		for(var i=remove_index_len-1; i>=0; i--) {
			var idx = remove_index[i];
			//console.log(idx, config.document_list[idx]);
			config.document_list.splice(idx, 1);
		}

		var document_info = {
			date: date,
			document_srl: document_srl,
			title: title
		};

		config.document_list.push(document_info);
		localStorage.setItem("layoutConfig", escape(JSON.stringify(config)));

		return true;
	},

	removeDocument: function(document_srl){
		var config = this.getData();
		if(!config || !document_srl) {
			return false;
		}

		var doc_len = config.document_list.length;
		var remove_index = [];
		for(var i=0; i<doc_len; i++) {
			if(config.document_list[i].document_srl == document_srl) {
				remove_index.push(i);
			}
			if(i>5) {
				remove_index.push(i);
			}
		}

		var remove_index_len = remove_index.length;
		for(var i=remove_index_len-1; i>=0; i--) {
			var idx = remove_index[i];
			config.document_list.splice(idx, 1);
		}

		localStorage.setItem("layoutConfig", escape(JSON.stringify(config)));

		return true;
	},

	resetDocumentList: function(){
		var config = this.getData();
		if(!config) {
			return false;
		}

		config.document_list = [];

		localStorage.setItem("layoutConfig", escape(JSON.stringify(config)));
		return true;
	},

	setConfig: function(key, value) {
		var config = this.getData();
		if(!config) {
			this.initStorage();
			config = this.getData();
			if(!config){
				return false;
			}
		}

		if(!key || !value){
			return false;
		}

		if(typeof(key) == 'object') { //나중에 일괄처리 가능하게끔.

		} else {
			config[key] = value;
		}

		localStorage.setItem("layoutConfig", escape(JSON.stringify(config)));
		return true;
	},

	unsetConfig: function(key) {
		var config = this.getData();
		if(!config) {
			this.initStorage();
			config = this.getData();
			if(!config){
				return false;
			}
		}

		if(!key) {
			return false;
		}

		if(typeof(key) == 'object') {

		} else {
			if(config[key] != 'undefined') {
				delete config[key];
			} else {
				return false;
			}
		}

		localStorage.setItem("layoutConfig", escape(JSON.stringify(config)));
		return true;
	},

	resetData : function() {
	 	try {localStorage.removeItem("layoutConfig");}
		catch (e) {}

		return true;
	}

};

(function($, global){
	var icons = {
		not_checked: '<i class="fa fa-square-o" aria-hidden="true"></i>',
		checked: '<i class="fa fa-check-square-o" aria-hidden="true"></i>'
	}

	var html_msg = {
		list_member_waiting: '<div id="menu_member_info"><div class="top-comment"><h3>데이터를 불러오는 중입니다...</h3></div></div>'
	}

	layoutConfig = window.layoutStorage.getData();

	$(document).ready(function(){

		var eth = conn();
		if(getCookie('d_s') && (eth == 0 || eth == 1) || getCookie('d_s') === 'E') {
			if(getCookie('txtmode') !== 'Y') {
				var select = 'div.xe_content';
				$(select).each(function() {
					$('img', this).each(function() {
						$(this).replaceWith($('<div class="txtmode"><p style="margin: 1em;">데이터 절약 모드 작동중<br><a href="'+$(this).attr('src')+'" target="_blank">(새창에서 이미지 열기)</a></p></div>'));
					});
				$('embed, iframe', this).each(function() {
					$(this).replaceWith($('<div class="txtmode"><p style="margin: 1em;">데이터 절약 모드 작동중<br><a href="'+$(this).attr('src')+'" target="_blank">(새창에서 미디어 열기)</a></p></div>'));
					});
				});
			};
			setCookie('txtmode', 'Y', expdate);
		} else if(getCookie('d_s') && eth == 2 && getCookie('d_s') !== 'E') {
			setCookie('txtmode', '', expdate);
			var $save_data = $('#main-menu #use_data_save');
			$save_data.addClass('checked').html(icons.checked);
			$save_data.parent().parent().find('.help').append('<strong> [임시해제중]</strong>');
		}


		/* LOGGING READED DOCUMENT */
		if(window.layoutConfig && window.layoutConfig.log_readed_log) {
			var url = window.location.href;
			var act = url.getQuery('act');
			var document_srl = noticeInit.document_srl; // notice 애드온 의존성이 있음.
			var title = $("#bd_doc .title h2").text().trim(); // 스케치북이 아닌 다른 게시판 스킨을 사용할 경우 별도로 수정 필요.
			if(act || !title) {
				return false; // <-- !!! CAUTION !!!
			}

			window.layoutStorage.addDocument(document_srl, title);
		}

	});

	var expdate = new Date();
	expdate.setTime(expdate.getTime() + 1000 * 3600 * 24 * 60);

	/* START TEXT MODE */

	var conn = function() {
		var metered = false;
		var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
		if(!connection) return 0;	//PC or another connection

		if ("metered" in connection && connection.metered == true) {
			metered = true;
		} else if ("type" in connection && connection.type == "cellular") {
			metered = true;
		}

		if (metered) {
			return 1;	//Cellular data
		} else {
			return 2;	//WiFi
		}
	}

	var setSaveData = function(a) {
		if(getCookie('d_s') === 'Y' || getCookie('d_s') === 'E')	{
			setCookie('d_s', '', expdate);
			setCookie('txtmode', '', expdate);
		} else {
			var eth = conn();
			if(eth == 0) {
				setCookie('d_s', 'E', expdate);
				setCookie('txtmode', 'Y', expdate);
				location.reload();
				return;
			}

			var msg = confirm("셀롤러 데이터를 사용할 때에만 사용하실경우 \'확인\'을,\n항상 사용하실경우 \'취소\'를 눌러주세요");
			if(!msg) {
				setCookie('d_s', 'E', expdate);
				location.reload();
				return;
			}
			if(eth == 0 || eth == 1) {
				setCookie('txtmode', 'Y', expdate);
			} else if (eth == 2) {
				setCookie('txtmode', '', expdate);
			}

			setCookie('d_s', 'Y', expdate);
		}

		location.reload();
	}

	if(!getCookie('d_s') && getCookie('txtmode')) {
		setCookie('d_s', 'Y', expdate);
	}

	$(document).on('click', 'a', function(){
		var eth = conn();

		if(!getCookie('d_s') && getCookie('txtmode')) {
			setCookie('d_s', 'Y', expdate);
		}

		if(getCookie('d_s') && (eth == 0 || eth == 1) || getCookie('d_s') === 'E') {
			setCookie('txtmode', 'Y', expdate);
		} else if(getCookie('d_s') && eth == 2 && getCookie('d_s') !== 'E'){
			setCookie('txtmode', '', expdate);
		}
	});


	/* END TEXT MODE */

	$(document).on('click', 'header.main .menu-trigger', function(e) {
		var $menu = $('#main-menu');

		$menu.show();
		$('#menu-bd').show();
		$('#nc_container').css('z-index', '1');

		$('body').attr('style', 'overflow:hidden; position:fixed;');
		$('#menu-config a').removeClass('on').filter('.board').addClass('on');

		resizeMenuList();
		setReadedDocument();
		loadUserConfig();

		$menu.find('#list_board').addClass('on');

		return false;
	});

	
	$(document).on('click', '#main-menu a.menu-close', function(e) {
		closeMenu();
		return false;
	});

	$(document).on('touchstart', '#menu-bd', function(e) {
		closeMenu();
		return true;
	});

	$(document).on('touchend', '#menu-bd', function(e) {
		return false;
	});

	$(document).on('click', '#menu-config a', function(e) {
		var $this = $(this);
		var target = $this.attr('class');
		var $menu = $('#main-menu');
		var $list_elem = $menu.find('.menu-content>div');

		if($this.hasClass('on')){
			return false;
		}

		$list_elem.removeClass('on');

		if(target == 'board') {
			$menu.find('#list_board').addClass('on');
		} else if(target == 'readed') {
			$menu.find('#list_readed_doc').addClass('on');
		} else if(target == 'config') {
			$menu.find('#list_config').addClass('on');
		} else if(target == 'member') {
			var $list_member = $menu.find('#list_member');
			$list_member.addClass('on');
			$list_member.html(html_msg.list_member_waiting);
			exec_json("moringworld.getMoringWorldMemberPage", {}, function(ret_obj){
				var html = ret_obj.html;
				$list_member.html(html);
				setInitMemberPage();
			});

		}

		$this.parent().parent().find('a').removeClass('on');
		$this.addClass('on');

		return false;
	});

	$(document).on('click', '#menu-list-config a.checkbox', function(e) {
		var $this = $(this);
		var target = $this.attr('class');

		if($this.hasClass('not_use')){
			return false;
		}

		if($this.hasClass('checked')) {
			$this.removeClass('checked').html(icons.not_checked);
		} else {
			$this.addClass('checked').html(icons.checked);
		}

		if($this.attr('id') == 'use_data_save') {
			setSaveData(); // 데이터 절약 모드
			return false;
		}

		saveUserConfig();

		return false;
	});

	$(document).on('click', '#btnReadedDelete', function(e) {
		var msg = confirm('읽은 글 리스트를 비웁니다.');
		if(msg) {
			layoutStorage.resetDocumentList();
			setReadedDocument();
		}

		return false;
	});

	$(document).on('click', '#menu_member_info #menu_member_back', function(e) {
		var $list_member = $('#main-menu #list_member');

		$list_member.html(html_msg.list_member_waiting);
		exec_json("moringworld.getMoringWorldMemberPage", {}, function(ret_obj){
			var html = ret_obj.html;
			$list_member.html(html);
			setInitMemberPage();
		});

		return false;
	});

	$(document).on('click', '#menu_member_info .changeInfo', function(e) {
		var $list_member = $('#main-menu #list_member');

		$list_member.html(html_msg.list_member_waiting);
		exec_json("moringworld.getMoringWorldModifyMemberInfo", {}, function(ret_obj){
			var html = ret_obj.html;
			$list_member.html(html);
		});

		return false;
	});

	$(document).on('click', '#menu_member_info .scrap', function(e) {
		var $list_member = $('#main-menu #list_member');

		$list_member.html(html_msg.list_member_waiting);
		exec_json("moringworld.getMoringWorldMemberScrapPage", {}, function(ret_obj){
			var html = ret_obj.html;
			$list_member.html(html);
		});

		return false;
	});

	$(document).on('click', '#menu_member_info .writeDoc', function(e) {
		var $list_member = $('#main-menu #list_member');

		$list_member.html(html_msg.list_member_waiting);
		exec_json("moringworld.getMoringWorldMemberWriteDocument", {}, function(ret_obj){
			var html = ret_obj.html;
			$list_member.html(html);
		});

		return false;
	});

	$(document).on('click', '#menu_member_info .writeCmt', function(e) {
		var $list_member = $('#main-menu #list_member');

		$list_member.html(html_msg.list_member_waiting);
		exec_json("moringworld.getMoringWorldMemberWriteComment", {}, function(ret_obj){
			var html = ret_obj.html;
			$list_member.html(html);
		});

		return false;
	});

	$(document).on('click', '#menu_member_info .scrap.pagination .prev, #menu_member_info .scrap.pagination .next', function(e) {
		var $this = $(this);
		var $list_member = $('#main-menu #list_member');
		var $pagination = $('#menu_member_info .scrap.pagination');
		var page = $pagination.find('span.now_page').text().trim() || 1;
		var last_page = $pagination.find('span.last_page').text().trim() || 1;
		page = parseInt(page);
		last_page = parseInt(last_page);

		if($this.hasClass('prev')){
			page--;
			if(page <= 0) {
				return false;
			}
		} else {
			page++;
			if(page > last_page) {
				return false;
			}
		}

		$list_member.html(html_msg.list_member_waiting);
		exec_json("moringworld.getMoringWorldMemberScrapPage", {page: page}, function(ret_obj){
			var html = ret_obj.html;
			$list_member.html(html);
		});

		return false;
	});

	$(document).on('click', '#menu_member_info .write-doc.pagination .prev, #menu_member_info .write-doc.pagination .next', function(e) {
		var $this = $(this);
		var $list_member = $('#main-menu #list_member');
		var $pagination = $('#menu_member_info .write-doc.pagination');
		var page = $pagination.find('span.now_page').text().trim() || 1;
		var last_page = $pagination.find('span.last_page').text().trim() || 1;
		page = parseInt(page);
		last_page = parseInt(last_page);

		if($this.hasClass('prev')){
			page--;
			if(page <= 0) {
				return false;
			}
		} else {
			page++;
			if(page > last_page) {
				return false;
			}
		}

		$list_member.html(html_msg.list_member_waiting);
		exec_json("moringworld.getMoringWorldMemberWriteDocument", {page: page}, function(ret_obj){
			var html = ret_obj.html;
			$list_member.html(html);
		});

		return false;
	});

	$(document).on('click', '#menu_member_info .write-cmt.pagination .prev, #menu_member_info .write-cmt.pagination .next', function(e) {
		var $this = $(this);
		var $list_member = $('#main-menu #list_member');
		var $pagination = $('#menu_member_info .write-cmt.pagination');
		var page = $pagination.find('span.now_page').text().trim() || 1;
		var last_page = $pagination.find('span.last_page').text().trim() || 1;
		page = parseInt(page);
		last_page = parseInt(last_page);

		if($this.hasClass('prev')){
			page--;
			if(page <= 0) {
				return false;
			}
		} else {
			page++;
			if(page > last_page) {
				return false;
			}
		}

		$list_member.html(html_msg.list_member_waiting);
		exec_json("moringworld.getMoringWorldMemberWriteComment", {page: page}, function(ret_obj){
			var html = ret_obj.html;
			$list_member.html(html);
		});

		return false;
	});


	$(document).on('submit', '#menu_modify_info', function(e) {
		e.preventDefault();

		var $form = $('#menu_modify_info');
		var $list_member = $('#main-menu #list_member');

		if($form.find('.member_info_modify').length) {
			var user_id = $form.find('input[name=user_id]').val();
			var email_address = $form.find('input[name=email_address]').val();
			var nick_name = $form.find('input[name=nick_name]').val();
			if(!nick_name) {
				alert('닉네임을 입력해주세요.');
				return true;
			}
			exec_json("member.procMemberModifyInfo", {user_id: user_id, email_address: email_address, nick_name: nick_name}, function(ret_obj){
				var message = ret_obj.message;
				alert(message);
				window.location.reload();
			});

		} else {
			var password = $form.find('input[name=password]').val();
			if(!password) {
				alert('비밀번호를 입력해주세요.');
				return true;
			}
			exec_json("member.procMemberModifyInfoBefore", {password: password}, function(ret_obj){
				var error = ret_obj.error;
				if(!error){

					exec_json("moringworld.getMoringWorldModifyMemberInfo", {}, function(ret_obj){
						var html = ret_obj.html;
						$list_member.html(html);
					});

				}
			});
		}

		return true;
	});

	$(document).on('click', '#menu_member_info .changePW', function(e) {
		var $list_member = $('#main-menu #list_member');

		$list_member.html(html_msg.list_member_waiting);
		exec_json("moringworld.getMoringWorldModifyMemberPassword", {}, function(ret_obj){
			var html = ret_obj.html;
			$list_member.html(html);
		});

		return false;
	});

	$(document).on('submit', '#menu_modify_pw', function(e) {
		e.preventDefault();

		var $form = $('#menu_modify_pw');
		var $list_member = $('#main-menu #list_member');

		var current_password = $form.find('input[name=current_password]').val();
		var password1 = $form.find('input[name=password1]').val();
		var password2 = $form.find('input[name=password2]').val();
		if(!current_password || !password1 || !password2) {
			alert('입력항목을 모두 입력해주세요.');
			return true;
		}
		if(password1 != password2) {
			alert('새 비밀번호 항목 값이 일치하지 않습니다.');
			return true;
		}

		exec_json("member.procMemberModifyPassword", {current_password: current_password, password1: password1, password2: password2}, function(ret_obj){
			var error = ret_obj.error;
			if(!error){
				alert(ret_obj.message);
				exec_json("moringworld.getMoringWorldMemberPage", {}, function(ret_obj){
					var html = ret_obj.html;
					$list_member.html(html);
				});

			}
		});

		return true;
	});

	$(document).on('submit', '#menu_member_login', function(e) {
		e.preventDefault();

		var $form = $('#menu_member_login');
		var $list_member = $('#main-menu #list_member');

		var user_id = $form.find('input[name=user_id]').val();
		var password = $form.find('input[name=password]').val();
		var keep_signed = $form.find('input[name=keep_signed]').prop("checked") ? "Y" : null;
		if(!user_id) {
			alert('아이디를 입력해주세요.');
			return true;
		}
		if(!password) {
			alert('비밀번호를 입력해주세요.');
			return true;
		}

		exec_json("member.procMemberLogin", {user_id: user_id, password: password, keep_signed: keep_signed}, function(ret_obj){
			var error = ret_obj.error;
			if(!error){
				//alert(ret_obj.message);
				window.location.reload();
			}
		});

		return true;
	});

	$(window).resize(function(e) {
		var $menu = $('#main-menu');
		if(!$menu.length){
			return;
		}

		if($menu.css('display') == 'block'){
			resizeMenuList();
		}
	});

	function resizeMenuList(){
		var $menu = $('#main-menu');
		var height = window.innerHeight;

		var top_height = $menu.find('.menu-top').height();
		var btm_height = $menu.find('.menu-bottom').height();

		var list_height = height - top_height - btm_height;

		$menu.find('.menu-content, .menu-content .swiper-container').css('height', list_height);

		return true;
	}

	function closeMenu(){
		var $menu = $('#main-menu');

		$menu.hide();
		$('#menu-bd').hide();
		$('#nc_container').css('z-index', '9999');


		$menu.find('.menu-content>div').removeClass('on');

		$('body').removeAttr('style');

		return true;
	}

	function loadUserConfig() {
		var $config_list = $("#menu-list-config");
		if(!$config_list.length || layoutConfig == 'undefined'){
			noticeMessage('설정값을 불러올 수 없습니다.');
			return false;
		}

		layoutConfig.use_noti ? $config_list.find('#use_noti').addClass('checked').html(icons.checked) : void(0);
		layoutConfig.use_noti_best ? $config_list.find('#use_noti_best').addClass('checked').html(icons.checked) : void(0);
		layoutConfig.log_readed_log ? $config_list.find('#log_readed_log').addClass('checked').html(icons.checked) : void(0);

		return true;
	}

	function saveUserConfig() {
		layoutConfig = window.layoutStorage.getData();
		if(!layoutConfig){
			noticeMessage('설정값을 가져올 수 없습니다.');
			return false;
		}
		var $config_list = $("#menu-list-config");

		layoutConfig.use_noti = $config_list.find('#use_noti').hasClass('checked');
		layoutConfig.use_noti_best = $config_list.find('#use_noti_best').hasClass('checked');
		layoutConfig.log_readed_log = $config_list.find('#log_readed_log').hasClass('checked');

		try {
			localStorage.setItem("layoutConfig", escape(JSON.stringify(layoutConfig)));
		} catch(e) {
			noticeMessage('설정을 저장할 수 없습니다.');
			return false;
		}

		noticeMessage('저장하였습니다.');

		return true;
	}

	function setReadedDocument() {
		var empty_message = '<li class="none"><span>최근 열람한 컨텐츠가 없습니다.</span></li>';
		var layoutConfig = layoutStorage.getData();
		if(!layoutConfig) {
			$('#main-menu .view_contents').html(empty_message);
			return false;
		}
		var doc_list = layoutConfig.document_list;
		var doc_len = doc_list.length;

		var html = [];

		if(!doc_len) {
			html.push(empty_message);
		} else {
			for(var i=doc_len-1; i>=0; i--) {
				html.push('<li class="title">');
				html.push('<a href="/'+doc_list[i].document_srl+'">'+doc_list[i].title+'</a>');
				html.push('</li>');
			}
		}

		$('#main-menu .view_contents').html(html.join(''));

		return true;
	}

	function setInitMemberPage() {
		var $list_member = $("#menu_member_info");
		var $btn = $list_member.find('.memberInfo-Btn');
		var href = window.location.href.setQuery('act', 'dispMemberLogout');

		var $login = $("#menu_member_login");

		if($login.length) {
			$login.find("input[name=mid]").val(current_mid);
			$login.find("#redirect_url").val(window.location.href);
		} else {
			$btn.find('a.logout').attr('href', href);
		}

		return true;
	}

	function noticeMessage(message) {
		if(typeof(noticeInit) == 'undefined') {
			alert(message);
		} else {
			$(document).trigger("MWMessage", message);
		}

		return true;
	}

	window.openMainMenu = {
		init: function() {
			var $menu = $('#main-menu');
			if(!$menu.length) {
				return false;
			}
			$menu.show();
			$('#menu-bd').show();
			$('#nc_container').css('z-index', '1');

			$('body').attr('style', 'overflow:hidden; position:fixed;');
			$('#menu-config a').removeClass('on').filter('.board').addClass('on');

			resizeMenuList();
			setReadedDocument();
			loadUserConfig();

			$menu.find('#list_board').addClass('on');

			return $menu;
		},

		login: function() {
			this.init();
			var $menu = this.init();
			if(!$menu) {
				return false;
			}
			var $list_elem = $menu.find('.menu-content>div');
			var $list_member = $menu.find('#list_member');

			var $menu_config = $menu.find('#menu-config');
			$menu_config.find('a.on').removeClass('on');
			$menu_config.find('a.member').addClass('on');

			$list_elem.removeClass('on');
			$list_member.addClass('on');
			$list_member.html(html_msg.list_member_waiting);
			exec_json("moringworld.getMoringWorldMemberPage", {}, function(ret_obj){
				var html = ret_obj.html;
				$list_member.html(html);
				setInitMemberPage();
//!!!S
				if(!$list_member.find('#menu_member_login').length) {
					window.location.reload(); // 이미 로그인된 회원으로 확인될 경우 페이지 새로고침.
				} else {
					$list_member.find('input[name=user_id]').focus();
				}
//!!!E
			});

			return true;
		}
	}

})(jQuery, this);

