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

    // 格式化文件大小
    formatBytes: function(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
      return (bytes / 1024 / 1024).toFixed(2) + ' MB';
    },

    // 创建Promise化的FileReader
    createFileReader: function() {
      const reader = new FileReader();
      const readAsArrayBuffer = (file) => new Promise((resolve, reject) => {
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });
      const readAsDataURL = (file) => new Promise((resolve, reject) => {
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      return { readAsArrayBuffer, readAsDataURL };
    },

    // 安全释放ObjectURL
    revokeObjectURL: function(url) {
      if (url) {
        URL.revokeObjectURL(url);
      }
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

  // ImageHelper 类 - 统一管理图片显示
  class ImageHelper {
    constructor() {
      this.objectURLs = new Set();
      window.addEventListener('beforeunload', () => {
        this.revokeAllURLs();
      });
    }

    showImage(container, url, options = {}) {
      container.innerHTML = '';
      const img = document.createElement('img');
      img.src = url;
      img.alt = options.alt || '';
      if (options.className) img.className = options.className;
      container.appendChild(img);
    }

    showPlaceholder(container, text) {
      container.innerHTML = '';
      const div = document.createElement('div');
      div.className = 'text-tools-placeholder';
      div.textContent = text;
      container.appendChild(div);
    }

    showLoading(container, text) {
      container.innerHTML = '';
      const div = document.createElement('div');
      div.className = 'text-tools-loading';
      div.textContent = text;
      container.appendChild(div);
    }

    showFileSummary(container, title, file, note) {
      container.innerHTML = '';
      const meta = document.createElement('div');
      meta.className = 'text-tools-meta';

      const titleEl = document.createElement('div');
      titleEl.className = 'text-tools-meta-title';
      titleEl.textContent = title;
      meta.appendChild(titleEl);

      const nameEl = document.createElement('div');
      nameEl.textContent = file.name || '未命名文件';
      meta.appendChild(nameEl);

      const sizeEl = document.createElement('div');
      sizeEl.className = 'text-tools-meta-detail';
      sizeEl.textContent = TextToolsUtils.formatBytes(file.size);
      meta.appendChild(sizeEl);

      if (note) {
        const noteEl = document.createElement('div');
        noteEl.className = 'text-tools-meta-detail';
        noteEl.textContent = note;
        meta.appendChild(noteEl);
      }

      container.appendChild(meta);
    }

    enableDownloadLink(link, url, filename, size) {
      link.href = url;
      link.download = filename;
      link.classList.remove('text-tools-hidden');
      if (size) {
        link.textContent = `下载（${TextToolsUtils.formatBytes(size)}）`;
      }
    }

    disableDownloadLink(link) {
      link.classList.add('text-tools-hidden');
      link.removeAttribute('href');
    }

    addObjectURL(url) {
      this.objectURLs.add(url);
    }

    revokeURL(url) {
      if (url) {
        this.objectURLs.delete(url);
        TextToolsUtils.revokeObjectURL(url);
      }
    }

    revokeAllURLs() {
      this.objectURLs.forEach(url => TextToolsUtils.revokeObjectURL(url));
      this.objectURLs.clear();
    }
  }

  // WASMHelper 类 - 管理WASM模块初始化
  class WASMHelper {
    constructor(statusEl, onReadyCallback) {
      this.statusEl = statusEl;
      this.onReadyCallback = onReadyCallback;
      this.ready = false;
      this.pendingActions = [];
      this.updateStatus('正在准备工具...');
    }

    updateStatus(text, isError = false) {
      if (this.statusEl) {
        TextToolsUtils.updateStatus(this.statusEl, text, isError);
      }
    }

    async init(initFunction) {
      try {
        await initFunction();
        this.ready = true;
        this.updateStatus('工具已就绪');
        if (this.onReadyCallback) {
          await this.onReadyCallback();
        }
        this.executePendingActions();
      } catch (error) {
        console.error('WASM init error:', error);
        this.updateStatus('初始化失败，请刷新后重试', true);
      }
    }

    async executePendingActions() {
      while (this.pendingActions.length > 0) {
        const action = this.pendingActions.shift();
        try {
          await action();
        } catch (error) {
          console.error('Pending action error:', error);
        }
      }
    }

    queueAction(action) {
      this.pendingActions.push(action);
    }

    isReady() {
      return this.ready;
    }
  }

  // FileUploadHelper 类 - 管理文件上传
  class FileUploadHelper {
    constructor(dropZone, fileInput, options = {}) {
      this.dropZone = dropZone;
      this.fileInput = fileInput;
      this.options = {
        maxFileSize: options.maxFileSize || Infinity,
        allowedTypes: options.allowedTypes || [], // 空数组表示接受所有类型
        onFileSelect: options.onFileSelect || (() => {}),
        onDragOver: options.onDragOver || (() => {}),
        onDragLeave: options.onDragLeave || (() => {}),
        ...options
      };
      this.setupEventHandlers();
    }

    setupEventHandlers() {
      // 拖拽事件
      this.dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        this.options.onDragOver(e);
      });

      this.dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        this.options.onDragLeave(e);
      });

      this.dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          this.handleFileSelect(files[0]);
        }
        this.options.onDragLeave(e);
      });

      // 点击上传
      this.dropZone.addEventListener('click', (e) => {
        if (!e.target.closest('input, button, a')) {
          this.fileInput.click();
        }
      });

      this.fileInput.addEventListener('change', () => {
        if (this.fileInput.files[0]) {
          this.handleFileSelect(this.fileInput.files[0]);
        }
      });
    }

    handleFileSelect(file) {
      // 检查文件大小
      if (this.options.maxFileSize !== Infinity && file.size > this.options.maxFileSize) {
        if (confirm('文件很大，浏览器可能卡顿。是否继续？')) {
          this.options.onFileSelect(file);
        }
        return;
      }

      // 检查文件类型
      if (this.options.allowedTypes.length > 0) {
        const fileType = file.type;
        const fileExtension = '.' + file.name.toLowerCase().split('.').pop();

        const isTypeAllowed = this.options.allowedTypes.some(type =>
          fileType === type || (type.startsWith('.') && fileExtension === type)
        );

        if (!isTypeAllowed) {
          const allowedExtensions = this.options.allowedTypes
            .filter(t => t.startsWith('.'))
            .join(', ');
          alert(`请选择正确的文件格式${allowedExtensions ? ': ' + allowedExtensions : ''}`);
          this.fileInput.value = '';
          return;
        }
      }

      this.options.onFileSelect(file);
    }
  }

  // 暴露到全局
  window.TextToolsUtils = TextToolsUtils;
  window.ImageHelper = ImageHelper;
  window.WASMHelper = WASMHelper;
  window.FileUploadHelper = FileUploadHelper;

})(window);