/* ============================================================
   我叫MT：崛起 · 攻略站 —— 英雄图鉴页脚本（heroes.html 专用）
   ------------------------------------------------------------
   引入顺序（见 heroes.html）：data/heroes.js → 本脚本 → common.js。
   执行到本脚本时 common.js 可能尚未加载，因此骨架挂载
   MTCommon.mount('heroes') 会在 MTCommon 可用时自动执行
   （本页顺序下为 DOMContentLoaded 后；若改为 forum.html 的
   data → common → 页面脚本顺序则立即执行，两种顺序均兼容）。
   职责：
     1. 挂载全站骨架（页头 / 导航高亮 / 页脚）
     2. 从 window.MT_HEROES 动态生成 阵营 / 稀有度 / 定位 筛选选项
     3. 渲染英雄卡：首字头像、名称、阵营/稀有度/定位徽章、tier 评级、
        获取途径、技能紧凑列表、培养建议
     4. 筛选与搜索（按名称和技能名匹配）即时重渲染并更新结果计数
   样式全部复用 assets/css/style.css 设计系统类，本文件零新增 CSS；
   数据为空或字段缺失时安全降级显示。
   ============================================================ */
(function () {
  'use strict';

  /* 阵营 → 设计系统类名映射：联盟→alliance(蓝) / 部落→horde(红) /
     邪能→neutral(灰蓝)。设计系统仅提供这三种阵营变体；未知阵营回退
     默认样式（头像金色渐变 / 徽章基础底色）。 */
  var FACTION_AVATAR = {
    '联盟': 'avatar--alliance',
    '部落': 'avatar--horde',
    '邪能': 'avatar--neutral'
  };
  var FACTION_BADGE = {
    '联盟': 'badge--alliance',
    '部落': 'badge--horde',
    '邪能': 'badge--neutral'
  };

  /* 阵营 → 纹章类名（卡片右上角装饰水印，stroke=currentColor） */
  var FACTION_CREST = {
    '联盟': 'alliance',
    '部落': 'horde',
    '邪能': 'neutral'
  };
  var CREST_SVG = {
    alliance: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M24 4 40 10v14c0 10-7 17-16 20-9-3-16-10-16-20V10Z"/><path d="M24 11v21M14 19h20"/></svg>',
    horde: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 38 34 12M14 12l24 24"/><path d="M34 12c3-4 7-5 10-4-1 4-4 7-8 8M14 12c-3-4-7-5-10-4 1 4 4 7 8 8"/><path d="M10 38l4 2M38 38l-4 2"/></svg>',
    neutral: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 24c6-9 12-13 20-13s14 4 20 13c-6 9-12 13-20 13S10 33 4 24Z"/><circle cx="24" cy="24" r="6"/><path d="M24 11V6M24 42v-5M8 15l-4-3M40 15l4-3M8 33l-4 3M40 33l4 3"/></svg>'
  };

  var el = {};                                   /* DOM 引用 */
  var state = { faction: '', rarity: '', role: '', q: '' };
  var heroes = [];                               /* 规整后的英雄数据 */
  var dataOk = false;                            /* 数据源是否有效非空 */

  /* ================= 工具 ================= */

  /* HTML 转义：所有数据文本拼入 innerHTML 前必须经过 */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function firstChar(s) {
    return String(s || '').charAt(0) || '?';
  }

  function badgeHTML(text, variant) {
    return '<span class="badge' + (variant ? ' ' + variant : '') + '">' +
      esc(text) + '</span>';
  }

  /* "T0"…"T4" → 0…4；无法解析 → 99（排序垫底） */
  function tierNum(tier) {
    var m = /^T(\d+)$/i.exec(String(tier || '').trim());
    return m ? parseInt(m[1], 10) : 99;
  }

  /* tier → 徽章变体：T0金 / T1紫 / T2蓝 / T3绿；
     T4 及未评级用 badge--muted 灰态降级 */
  function tierBadgeVariant(tier) {
    var n = tierNum(tier);
    if (n === 0) return 'badge--tier0';
    if (n === 1) return 'badge--tier1';
    if (n === 2) return 'badge--tier2';
    if (n === 3) return 'badge--tier3';
    return 'badge--muted';
  }

  /* 稀有度（资质）→ 徽章变体：≥20 传说橙 / ≥18 史诗紫 / ≥15 稀有蓝 /
     其余数字 普通；S+ 按传说处理；无信息用 badge--muted 降级 */
  function rarityBadgeVariant(rarity) {
    var s = String(rarity || '');
    var m = /(\d+)/.exec(s);
    if (m) {
      var n = parseInt(m[1], 10);
      if (n >= 20) return 'badge--legendary';
      if (n >= 18) return 'badge--epic';
      if (n >= 15) return 'badge--rare';
      return 'badge--common';
    }
    return /S\+/.test(s) ? 'badge--legendary' : 'badge--muted';
  }

  /* 复合定位（如「坦克/辅助」）拆成原子定位数组，用于筛选匹配 */
  function splitRoles(role) {
    return String(role || '')
      .split(/[\/、，,\s]+/)
      .filter(function (v) { return v; });
  }

  /* 保序去重 */
  function uniq(arr) {
    var seen = {};
    var out = [];
    arr.forEach(function (v) {
      if (!seen[v]) { seen[v] = 1; out.push(v); }
    });
    return out;
  }

  /* ================= 数据规整（缺失字段安全降级） ================= */

  function normalizeHeroes(raw) {
    var list = [];
    if (!Array.isArray(raw)) return list;
    raw.forEach(function (h, i) {
      if (!h || typeof h !== 'object') h = {};
      list.push({
        name:    h.name || h.id || '未知英雄',
        img:     h.img || '',
        faction: h.faction || '',
        rarity:  h.rarity || '',
        role:    h.role || '',
        tier:    h.tier || '',
        obtain:  h.obtain || '待补充',
        summary: h.summary || '培养建议整理中。',
        skills:  Array.isArray(h.skills)
                   ? h.skills.filter(function (s) { return s && typeof s === 'object'; })
                   : [],
        roles:   splitRoles(h.role),
        tierNum: tierNum(h.tier),
        idx:     i
      });
    });
    return list;
  }

  /* ================= 筛选选项（一律由数据动态生成，不写死） ================= */

  function fillSelect(select, values) {
    if (!select) return;
    while (select.firstChild) select.removeChild(select.firstChild);
    var all = document.createElement('option');
    all.value = '';
    all.textContent = '全部';
    select.appendChild(all);
    values.forEach(function (v) {
      var o = document.createElement('option');
      o.value = v;
      o.textContent = v;
      select.appendChild(o);
    });
  }

  function buildFilterOptions() {
    /* 阵营：按数据出现顺序 */
    fillSelect(el.faction, uniq(
      heroes.map(function (h) { return h.faction; }).filter(Boolean)
    ));

    /* 稀有度：解析出的资质数字大者在前，无数字的排后面 */
    var rarities = uniq(
      heroes.map(function (h) { return h.rarity; }).filter(Boolean)
    );
    var rarityScore = function (v) {
      var m = /(\d+)/.exec(v);
      return m ? parseInt(m[1], 10) : -1;
    };
    fillSelect(el.rarity, rarities.slice().sort(function (a, b) {
      return rarityScore(b) - rarityScore(a);
    }));

    /* 定位：复合定位拆为原子定位，按数据出现顺序 */
    var roles = [];
    heroes.forEach(function (h) { roles = roles.concat(h.roles); });
    fillSelect(el.role, uniq(roles));
  }

  /* ================= 过滤 / 渲染 ================= */

  function matches(h) {
    if (state.faction && h.faction !== state.faction) return false;
    if (state.rarity && h.rarity !== state.rarity) return false;
    if (state.role && h.roles.indexOf(state.role) === -1) return false;
    if (state.q) {
      var q = state.q;
      var inName = h.name.toLowerCase().indexOf(q) !== -1;
      var inSkill = h.skills.some(function (s) {
        return String(s.name || '').toLowerCase().indexOf(q) !== -1;
      });
      if (!inName && !inSkill) return false;
    }
    return true;
  }

  function cardHTML(h) {
    var avatarVariant = FACTION_AVATAR[h.faction] || '';
    var avatarCls = 'avatar' + (avatarVariant ? ' ' + avatarVariant : '');
    var glyph = esc(firstChar(h.name));

    /* 立绘模式：数据提供 img 路径（如 assets/img/heroes/xxx.png）时显示图片，
       加载失败自动移除并回落到首字相框 */
    var avatar;
    if (h.img) {
      avatar = '<span class="' + avatarCls + ' avatar--hasimg" aria-hidden="true">' +
        '<img src="' + esc(h.img) + '" alt="" loading="lazy" onerror="this.remove()">' +
        '<span class="avatar__glyph">' + glyph + '</span></span>';
    } else {
      avatar = '<span class="' + avatarCls + '" aria-hidden="true">' + glyph + '</span>';
    }

    /* 阵营纹章水印（卡片右上角，纯装饰） */
    var crestKey = FACTION_CREST[h.faction];
    var crest = crestKey
      ? '<span class="card__crest crest--' + crestKey + '" aria-hidden="true">' +
        CREST_SVG[crestKey] + '</span>'
      : '';

    var badges = [
      h.faction
        ? badgeHTML(h.faction, FACTION_BADGE[h.faction] || '')
        : badgeHTML('阵营未知', ''),
      h.rarity
        ? badgeHTML(h.rarity, rarityBadgeVariant(h.rarity))
        : badgeHTML('稀有度待补充', 'badge--muted'),
      h.role
        ? badgeHTML(h.role, '')
        : badgeHTML('定位待补充', 'badge--muted'),
      badgeHTML(h.tier || '未评级', tierBadgeVariant(h.tier))
    ].join(' ');

    var skillsHTML;
    if (h.skills.length) {
      skillsHTML = '<ul>' + h.skills.map(function (s) {
        var desc = s.desc || '';
        return '<li><strong>' + esc(s.name || '技能') + '</strong>' +
          (desc ? '<span class="text-muted">：' + esc(desc) + '</span>' : '') +
          '</li>';
      }).join('') + '</ul>';
    } else {
      skillsHTML = '<ul><li class="text-muted">技能资料整理中</li></ul>';
    }

    return '<article class="card">' + crest +
      '<div class="card__head">' + avatar +
        '<h3 class="card__title">' + esc(h.name) + '</h3>' +
      '</div>' +
      '<div>' + badges + '</div>' +
      '<div class="text-muted"><strong>获取：</strong>' + esc(h.obtain) + '</div>' +
      skillsHTML +
      '<p class="card__desc">' + esc(h.summary) + '</p>' +
    '</article>';
  }

  function render() {
    /* tier 靠前者在前，同 tier 保持数据原顺序 */
    var list = heroes.filter(matches).sort(function (a, b) {
      return (a.tierNum - b.tierNum) || (a.idx - b.idx);
    });

    if (el.grid) el.grid.innerHTML = list.map(cardHTML).join('');

    if (el.count) {
      el.count.textContent = dataOk
        ? '共 ' + list.length + ' / ' + heroes.length + ' 位英雄'
        : '英雄数据未能加载，当前共 0 位英雄';
    }

    var empty = list.length === 0;
    if (el.empty) {
      /* .alert 的 display:flex 会覆盖 hidden 属性的 UA 规则，
         因此除 hidden 外再用 inline display 同步兜底 */
      el.empty.hidden = !empty;
      el.empty.style.display = empty ? '' : 'none';
      el.empty.classList.toggle('alert--info', dataOk);
      el.empty.classList.toggle('alert--warn', !dataOk);
    }
    if (el.emptyText) {
      el.emptyText.textContent = dataOk
        ? '没有符合条件的英雄，试试调整筛选条件或搜索关键词。'
        : '英雄数据未能加载：请确认 data/heroes.js 已定义 window.MT_HEROES。';
    }
    /* .btn 的 display:inline-flex 同样会覆盖 hidden，一并内联兜底 */
    if (el.reset) {
      el.reset.hidden = !dataOk;
      el.reset.style.display = dataOk ? '' : 'none';
    }
  }

  /* ================= 事件 ================= */

  function resetFilters() {
    state.faction = '';
    state.rarity = '';
    state.role = '';
    state.q = '';
    if (el.faction) el.faction.value = '';
    if (el.rarity) el.rarity.value = '';
    if (el.role)   el.role.value = '';
    if (el.search) el.search.value = '';
    render();
  }

  function bindEvents() {
    /* 筛选变化即时重渲染 */
    if (el.faction) el.faction.addEventListener('change', function () {
      state.faction = el.faction.value;
      render();
    });
    if (el.rarity) el.rarity.addEventListener('change', function () {
      state.rarity = el.rarity.value;
      render();
    });
    if (el.role) el.role.addEventListener('change', function () {
      state.role = el.role.value;
      render();
    });
    /* 搜索：按名称与技能名匹配，输入即时重渲染 */
    if (el.search) el.search.addEventListener('input', function () {
      state.q = el.search.value.trim().toLowerCase();
      render();
    });
    if (el.reset) el.reset.addEventListener('click', resetFilters);
  }

  /* ================= 启动 ================= */

  function cacheDom() {
    el.faction   = document.getElementById('hero-faction');
    el.rarity    = document.getElementById('hero-rarity');
    el.role      = document.getElementById('hero-role');
    el.search    = document.getElementById('hero-search');
    el.count     = document.getElementById('hero-count');
    el.grid      = document.getElementById('hero-grid');
    el.empty     = document.getElementById('hero-empty');
    el.emptyText = document.getElementById('hero-empty-text');
    el.reset     = document.getElementById('hero-reset');
  }

  function boot() {
    cacheDom();
    var raw = window.MT_HEROES;
    dataOk = Array.isArray(raw) && raw.length > 0;
    heroes = normalizeHeroes(raw);
    buildFilterOptions();
    bindEvents();
    render();
  }

  function mountSkeleton() {
    if (window.MTCommon && typeof window.MTCommon.mount === 'function') {
      window.MTCommon.mount('heroes');
    }
  }

  /* 本页脚本顺序为 data → heroes.js → common.js：执行到此处时
     common.js 尚未加载，等待 DOMContentLoaded（全部同步脚本执行完毕）
     再挂载骨架并渲染；若 common.js 已在前（forum.html 顺序）则立即执行。 */
  function start() {
    if (window.MTCommon) {
      mountSkeleton();
      boot();
      return;
    }
    var deferred = function () {
      mountSkeleton();
      boot();
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', deferred);
    } else {
      deferred();
    }
  }

  start();
})();
