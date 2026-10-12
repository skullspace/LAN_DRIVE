(function () {
  var nextId = 0;
  var widgets = [];
  var probe = document.createElement("span");
  probe.className = "win98-select-value";
  probe.style.cssText = "position:absolute;left:-9999px;top:0;visibility:hidden;";
  document.body.appendChild(probe);

  function labelText(select) {
    if (select.getAttribute("aria-label")) return select.getAttribute("aria-label");
    if (select.labels && select.labels.length) {
      var copy = select.labels[0].cloneNode(true);
      Array.prototype.forEach.call(copy.querySelectorAll("select"), function (node) {
        node.remove();
      });
      var text = copy.textContent.replace(/\s+/g, " ").trim();
      if (text) return text;
    }
    return select.getAttribute("name") || "Select";
  }

  function firstEnabled(options, start, step) {
    var index = start;
    while (index >= 0 && index < options.length) {
      if (!options[index].disabled) return index;
      index += step;
    }
    return -1;
  }

  function enhanceSelect(select) {
    if (select.classList.contains("win98-native")) return;
    if (select.multiple || select.size > 1) return;

    var widgetId = nextId;
    nextId += 1;
    select.classList.add("win98-native");
    select.tabIndex = -1;
    select.setAttribute("aria-hidden", "true");

    var widget = document.createElement("div");
    widget.className = "win98-select";
    widget.tabIndex = select.disabled ? -1 : 0;
    widget.setAttribute("role", "combobox");
    widget.setAttribute("aria-haspopup", "listbox");
    widget.setAttribute("aria-expanded", "false");
    widget.setAttribute("aria-label", labelText(select));
    if (select.disabled) {
      widget.classList.add("is-disabled");
      widget.setAttribute("aria-disabled", "true");
    }
    if (select.style.width) widget.style.width = select.style.width;

    var box = document.createElement("div");
    box.className = "win98-select-box";
    var valueEl = document.createElement("span");
    valueEl.className = "win98-select-value";
    var button = document.createElement("span");
    button.className = "win98-select-button";
    button.setAttribute("aria-hidden", "true");
    var arrow = document.createElement("span");
    arrow.className = "win98-select-arrow";
    button.appendChild(arrow);
    box.appendChild(valueEl);
    box.appendChild(button);

    var list = document.createElement("ul");
    list.className = "win98-select-list";
    list.id = (select.id || "win98-select") + "-listbox-" + widgetId;
    list.setAttribute("role", "listbox");
    list.setAttribute("aria-hidden", "true");
    widget.setAttribute("aria-controls", list.id);
    widget.appendChild(box);
    widget.appendChild(list);
    select.insertAdjacentElement("afterend", widget);

    var options = [];
    var items = [];
    var active = 0;

    function renderValue() {
      var option = options[select.selectedIndex] || options[0];
      valueEl.textContent = option ? option.text : "";
      items.forEach(function (item, index) {
        if (!item) return;
        item.setAttribute("aria-selected", index === select.selectedIndex ? "true" : "false");
      });
    }

    function measure() {
      var widest = 72;
      options.forEach(function (option) {
        probe.textContent = option.text;
        widest = Math.max(widest, probe.offsetWidth);
      });
      Array.prototype.forEach.call(list.querySelectorAll(".win98-select-group"), function (group) {
        probe.textContent = group.textContent;
        widest = Math.max(widest, probe.offsetWidth);
      });
      valueEl.style.minWidth = widest + "px";
    }

    function setActive(index) {
      if (!items.length) return;
      if (options[index] && options[index].disabled) {
        var enabled = firstEnabled(options, index, 1);
        if (enabled < 0) enabled = firstEnabled(options, index, -1);
        if (enabled < 0) return;
        index = enabled;
      }
      active = Math.max(0, Math.min(items.length - 1, index));
      items.forEach(function (item, itemIndex) {
        if (item) item.classList.toggle("is-active", itemIndex === active);
      });
      if (widget.classList.contains("is-open") && items[active]) {
        widget.setAttribute("aria-activedescendant", items[active].id);
      }
    }

    function commit(index) {
      if (!options[index] || options[index].disabled) return;
      var changed = select.selectedIndex !== index;
      select.selectedIndex = index;
      renderValue();
      if (changed) select.dispatchEvent(new Event("change", { bubbles: true }));
    }

    function closeList() {
      if (!widget.classList.contains("is-open")) return;
      widget.classList.remove("is-open");
      widget.setAttribute("aria-expanded", "false");
      widget.removeAttribute("aria-activedescendant");
      list.setAttribute("aria-hidden", "true");
      items.forEach(function (item) {
        if (item) item.classList.remove("is-active");
      });
    }

    function openList() {
      if (select.disabled || widget.classList.contains("is-open")) return;
      widgets.forEach(function (entry) {
        if (entry.widget !== widget) entry.close();
      });
      widget.classList.add("is-open");
      widget.setAttribute("aria-expanded", "true");
      list.removeAttribute("aria-hidden");
      setActive(select.selectedIndex > -1 ? select.selectedIndex : 0);
    }

    function syncOptions() {
      var wasOpen = widget.classList.contains("is-open");
      options = [];
      items = [];
      list.textContent = "";
      var index = 0;

      function addOption(option) {
        var item = document.createElement("li");
        var optionIndex = index;
        item.className = "win98-select-option";
        item.id = list.id + "-option-" + optionIndex;
        item.setAttribute("role", "option");
        item.setAttribute("aria-selected", "false");
        item.textContent = option.text;
        if (option.disabled) {
          item.classList.add("is-disabled");
          item.setAttribute("aria-disabled", "true");
        }
        item.addEventListener("mouseenter", function () {
          if (!option.disabled) setActive(optionIndex);
        });
        item.addEventListener("click", function () {
          if (option.disabled) return;
          commit(optionIndex);
          closeList();
          widget.focus();
        });
        list.appendChild(item);
        options[optionIndex] = option;
        items[optionIndex] = item;
        index += 1;
      }

      Array.prototype.forEach.call(select.children, function (child) {
        if (child.tagName === "OPTGROUP") {
          var group = document.createElement("li");
          group.className = "win98-select-group";
          group.setAttribute("role", "presentation");
          group.textContent = child.label;
          list.appendChild(group);
          Array.prototype.forEach.call(child.children, function (option) {
            if (option.tagName === "OPTION") addOption(option);
          });
        } else if (child.tagName === "OPTION") {
          addOption(child);
        }
      });

      if (active >= options.length) active = Math.max(0, options.length - 1);
      measure();
      renderValue();
      if (wasOpen) setActive(select.selectedIndex > -1 ? select.selectedIndex : active);
    }

    widget.addEventListener("mousedown", function (event) {
      if (select.disabled) return;
      if (list.contains(event.target)) {
        event.preventDefault();
        return;
      }
      event.preventDefault();
      widget.focus();
      if (widget.classList.contains("is-open")) closeList();
      else openList();
    });

    widget.addEventListener("keydown", function (event) {
      if (select.disabled || !options.length) return;
      var key = event.key;
      var open = widget.classList.contains("is-open");
      var delta = key === "ArrowDown" ? 1 : -1;

      if (key === "ArrowDown" || key === "ArrowUp") {
        event.preventDefault();
        if (event.altKey) {
          if (key === "ArrowDown") openList();
          else {
            commit(active);
            closeList();
          }
          return;
        }
        var current = open ? active : select.selectedIndex;
        var next = firstEnabled(options, current + delta, delta);
        if (next < 0) return;
        if (open) setActive(next);
        else commit(next);
        return;
      }

      if (key === "Enter" || key === " ") {
        event.preventDefault();
        if (!open) openList();
        else {
          commit(active);
          closeList();
        }
        return;
      }

      if (key === "Escape" || key === "F4") {
        event.preventDefault();
        if (key === "F4" && !open) openList();
        else closeList();
        return;
      }

      if (key === "Home" || key === "End") {
        event.preventDefault();
        var edge = firstEnabled(options, key === "Home" ? 0 : options.length - 1, key === "Home" ? 1 : -1);
        if (edge < 0) return;
        if (open) setActive(edge);
        else commit(edge);
        return;
      }

      if (key.length === 1 && key.trim()) {
        var start = (open ? active : select.selectedIndex) + 1;
        for (var step = 0; step < options.length; step += 1) {
          var match = (start + step) % options.length;
          if (options[match].disabled) continue;
          if (options[match].text.toLowerCase().charAt(0) === key.toLowerCase()) {
            if (open) setActive(match);
            else commit(match);
            break;
          }
        }
      }
    });

    Array.prototype.forEach.call(select.labels || [], function (label) {
      label.addEventListener("click", function (event) {
        if (select.disabled) return;
        event.preventDefault();
        widget.focus();
      });
    });

    select.addEventListener("change", renderValue);
    new MutationObserver(syncOptions).observe(select, {
      childList: true,
      subtree: true,
      characterData: true
    });
    new MutationObserver(function () {
      var disabled = select.disabled;
      widget.classList.toggle("is-disabled", disabled);
      widget.tabIndex = disabled ? -1 : 0;
      widget.setAttribute("aria-disabled", disabled ? "true" : "false");
      if (disabled) closeList();
    }).observe(select, { attributes: true, attributeFilter: ["disabled"] });

    widgets.push({ widget: widget, close: closeList });
    syncOptions();
  }

  document.addEventListener("mousedown", function (event) {
    widgets.forEach(function (entry) {
      if (!entry.widget.contains(event.target)) entry.close();
    });
  });

  function scan(root) {
    if (!root || !root.querySelectorAll) return;
    if (root.nodeType === 1 && root.matches("select")) enhanceSelect(root);
    Array.prototype.forEach.call(root.querySelectorAll("select"), enhanceSelect);
  }

  scan(document);
  new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      Array.prototype.forEach.call(mutation.addedNodes, function (node) {
        scan(node);
      });
    });
  }).observe(document.body, { childList: true, subtree: true });
})();