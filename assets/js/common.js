/* ============================================================
   我叫MT：崛起 · 攻略站 —— 全站公共脚本
   ------------------------------------------------------------
   暴露：window.MTCommon.mount(activeKey)
     activeKey ∈ index / heroes / lineup / beginner / resource / forum / feedback
   职责：
     1. 在 body 顶部注入页头（站点名 + 七项导航含反馈 + 当前页高亮）
     2. 移动端汉堡菜单开合（点按切换 / 点链接关闭 / Esc 关闭 /
        拉宽到桌面自动收起）
     3. 在 body 末尾注入页脚（含免责声明与反馈入口）
     4. 注入右下角悬浮反馈按钮（反馈页自身除外）
   用法：页面脚本第一行调用 MTCommon.mount("forum")，随后再执行页面逻辑。
   零依赖，纯原生 JS。
   ============================================================ */
(function () {
  'use strict';

  var SITE_NAME = '我叫MT：崛起 · 攻略站';

  /* 七项导航：key → 文件 + 文案（feedback 为反馈页入口） */
  var NAV_ITEMS = [
    { key: 'index',    href: 'index.html',    label: '首页' },
    { key: 'heroes',   href: 'heroes.html',   label: '英雄图鉴' },
    { key: 'lineup',   href: 'lineup.html',   label: '阵容推荐' },
    { key: 'beginner', href: 'beginner.html', label: '新手入门' },
    { key: 'resource', href: 'resource.html', label: '游戏资源' },
    { key: 'forum',    href: 'forum.html',    label: '交流区' },
    { key: 'feedback', href: 'feedback.html', label: '反馈' }
  ];

  function isKnownKey(key) {
    return NAV_ITEMS.some(function (item) { return item.key === key; });
  }

  /* 生成单个导航项 <li> */
  function navListItem(item, activeKey) {
    var li = document.createElement('li');
    var a = document.createElement('a');
    a.href = item.href;
    a.className = 'nav-link';
    a.textContent = item.label;
    if (item.key === activeKey) {
      a.classList.add('nav-link--active');
      a.setAttribute('aria-current', 'page');
    }
    li.appendChild(a);
    return li;
  }

  /* 页头 */
  function buildHeader(activeKey) {
    var header = document.createElement('header');
    header.className = 'site-header';

    var brand = document.createElement('a');
    brand.className = 'brand';
    brand.href = 'index.html';
    var logo = document.createElement('span');
    logo.className = 'brand__logo';
    logo.innerHTML = '<img src="assets/img/logo.svg" alt="MT">';
    var name = document.createElement('span');
    name.className = 'brand__name';
    name.textContent = SITE_NAME;
    brand.appendChild(logo);
    brand.appendChild(name);

    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'nav-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', 'site-nav');
    toggle.setAttribute('aria-label', '打开菜单');
    for (var i = 0; i < 3; i++) {
      var bar = document.createElement('span');
      bar.className = 'nav-toggle__bar';
      toggle.appendChild(bar);
    }

    var nav = document.createElement('nav');
    nav.id = 'site-nav';
    nav.className = 'site-nav';
    nav.setAttribute('aria-label', '站点导航');
    var list = document.createElement('ul');
    list.className = 'nav-list';
    NAV_ITEMS.forEach(function (item) {
      list.appendChild(navListItem(item, activeKey));
    });
    nav.appendChild(list);

    var inner = document.createElement('div');
    inner.className = 'container site-header__inner';
    inner.appendChild(brand);
    inner.appendChild(toggle);
    inner.appendChild(nav);
    header.appendChild(inner);
    return header;
  }

  /* 页脚 */
  function buildFooter() {
    var footer = document.createElement('footer');
    footer.className = 'site-footer';

    var inner = document.createElement('div');
    inner.className = 'container site-footer__inner';

    var brand = document.createElement('p');
    brand.className = 'site-footer__brand';
    var logo = document.createElement('span');
    logo.className = 'brand__logo';
    logo.innerHTML = '<img src="assets/img/logo.svg" alt="MT">';
    brand.appendChild(logo);
    var name = document.createElement('span');
    name.textContent = SITE_NAME;
    brand.appendChild(name);

    var nav = document.createElement('ul');
    nav.className = 'site-footer__nav';
    NAV_ITEMS.forEach(function (item) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = item.href;
      a.textContent = item.label;
      li.appendChild(a);
      nav.appendChild(li);
    });

    var disclaimer = document.createElement('p');
    disclaimer.className = 'site-footer__disclaimer';
    disclaimer.textContent = '数据整理自网络公开攻略，仅供参考。';

    var meta = document.createElement('p');
    meta.className = 'site-footer__meta';
    meta.textContent = '© ' + new Date().getFullYear() + ' ' + SITE_NAME +
      ' · 玩家非营利攻略站，与游戏官方无关，仅供学习交流。';

    inner.appendChild(brand);
    inner.appendChild(nav);
    inner.appendChild(disclaimer);
    inner.appendChild(meta);
    footer.appendChild(inner);
    return footer;
  }

  /* 反馈悬浮按钮：右下角固定入口（反馈页自身不注入） */
  function buildFeedbackFab() {
    var fab = document.createElement('a');
    fab.className = 'feedback-fab';
    fab.href = 'feedback.html';
    fab.setAttribute('aria-label', '反馈 Feedback');
    fab.setAttribute('data-mt', '1');
    fab.innerHTML =
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M4 5h16v11H9l-5 4V5Z"/><path d="M8 9h8M8 12h5"/></svg>' +
      '<span>反馈</span>';
    return fab;
  }

  /* 汉堡菜单行为（同一页面只绑定一次，靠 dataset 防重） */
  function bindMenu(header) {
    if (header.dataset.mtMenuBound === '1') return;
    header.dataset.mtMenuBound = '1';

    var toggle = header.querySelector('.nav-toggle');
    if (!toggle) return;

    function isOpen() {
      return header.classList.contains('site-header--open');
    }
    function close() {
      header.classList.remove('site-header--open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', '打开菜单');
    }
    function open() {
      header.classList.add('site-header--open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', '关闭菜单');
    }

    toggle.addEventListener('click', function () {
      isOpen() ? close() : open();
    });

    /* 点击任意导航链接后收起菜单 */
    header.addEventListener('click', function (e) {
      if (e.target.closest('.nav-link')) close();
    });

    /* Esc 关闭并回到按钮 */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) {
        close();
        toggle.focus();
      }
    });

    /* 拉宽到桌面断点时自动收起，避免残留展开态。
       matchMedia('change') 为主，window resize 兜底（部分内嵌 WebView 不派发 MQ change）。 */
    var mq = window.matchMedia('(min-width: 768px)');
    function collapseOnDesktop() {
      if (mq.matches && isOpen()) close();
    }
    if (mq.addEventListener) {
      mq.addEventListener('change', collapseOnDesktop);
    }
    window.addEventListener('resize', collapseOnDesktop);
  }

  /**
   * 挂载页头与页脚
   * @param {string} activeKey 当前页 key：index/heroes/lineup/beginner/resource/forum/feedback
   * @returns {{header: Element, footer: Element}}
   */
  function mount(activeKey) {
    if (!isKnownKey(activeKey)) {
      console.warn('[MTCommon] mount(activeKey) 收到未知页面 key：' +
        activeKey + '，导航将不高亮任何项。');
    }

    var body = document.body;
    var existed = body.querySelector('.site-header[data-mt="1"]');
    var header, footer;

    if (existed) {
      /* 重复调用：仅刷新高亮，不重复注入 */
      header = existed;
      footer = body.querySelector('.site-footer[data-mt="1"]');
      header.querySelectorAll('.nav-link').forEach(function (a) {
        a.classList.remove('nav-link--active');
        a.removeAttribute('aria-current');
      });
      var current = header.querySelector('.nav-link[href="' +
        (activeKey && NAV_ITEMS.filter(function (i) { return i.key === activeKey; })[0] || {}).href + '"]');
      if (current) {
        current.classList.add('nav-link--active');
        current.setAttribute('aria-current', 'page');
      }
    } else {
      header = buildHeader(activeKey);
      header.setAttribute('data-mt', '1');
      body.insertBefore(header, body.firstChild);   /* 页头置于 body 顶部 */

      footer = buildFooter();
      footer.setAttribute('data-mt', '1');
      body.appendChild(footer);                     /* 页脚置于 body 末尾 */
    }

    bindMenu(header);

    /* 右下角悬浮反馈按钮：除反馈页外的所有页面注入（防重） */
    if (activeKey !== 'feedback' && !body.querySelector('.feedback-fab[data-mt="1"]')) {
      body.appendChild(buildFeedbackFab());
    }

    return { header: header, footer: footer };
  }

  window.MTCommon = {
    mount: mount,
    siteName: SITE_NAME,
    navItems: NAV_ITEMS.slice()
  };
})();
