// 【工具】通用函数库
(function(window) {
  'use strict';

  const TextToolsUtils = {
    // 创建防抖函数（每个页面需要独立计时器）
    createDebounce: function() {
      let timer = null;
      return function(func, wait) {
        return function() {
          clearTimeout(timer);
          timer = setTimeout(func, wait);
        };
      };
    },

    // 设置清除按钮功能
    setupClearButton: function(button, textareas, statusEl, additionalCallbacks) {
      button.addEventListener('click', function() {
        textareas.forEach(t => t.value = '');
        if (statusEl) {
          statusEl.textContent = '已清除';
          statusEl.style.color = 'var(--tools-muted)';
        }
        if (additionalCallbacks) {
          additionalCallbacks.forEach(cb => cb());
        }
      });
    },

    // 通用状态更新
    updateStatus: function(el, text, isError = false) {
      el.textContent = text;
      if (isError) {
        el.style.color = 'var(--tools-danger)';
      } else {
        el.style.color = 'var(--tools-muted)';
      }
    },

    // 通用计数更新
    updateCounts: function(counterEl, text, unit = '字符') {
      counterEl.textContent = (text || '').length + ' ' + unit;
    },

    // 设置复制按钮功能
    setupCopyButton: function(button, getText, successEl) {
      button.addEventListener('click', function() {
        const text = getText();
        if (text) {
          navigator.clipboard.writeText(text).then(function() {
            if (successEl) {
              successEl.style.display = 'inline';
              setTimeout(function() {
                successEl.style.display = 'none';
              }, 2000);
            }
          }).catch(function(err) {
            console.error('Copy failed:', err);
          });
        }
      });
    },

    // 设置下载链接功能
    setupDownloadLink: function(link, getData) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const data = getData();
        if (data && data.blob && data.filename) {
          const url = URL.createObjectURL(data.blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = data.filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      });
    }
  };

  // 暴露到全局
  window.TextToolsUtils = TextToolsUtils;

})(window);