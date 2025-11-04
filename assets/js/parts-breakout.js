// Vanilla-JS replacement for the former jQuery version of Parts Breakout
// ================================================================
// This file intentionally contains *no* jQuery so it can run on sites
// that do not bundle or enqueue the library.
// Everything that used to rely on jQuery / jQuery-UI draggable has been
// re-implemented with modern DOM APIs, CSS, and Pointer / Mouse events.
// ----------------------------------------------------------------
(() => {
  "use strict";

  /* -------------------------------------------------------------
   *  Small DOM helper utilities ( ✨ no external deps )
   * ----------------------------------------------------------- */
  const $qs  = (sel, ctx = document) => ctx.querySelector(sel);
  const $qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const on     = (el, evt, handler, opts) => el.addEventListener(evt, handler, opts);
  const off    = (el, evt, handler, opts) => el.removeEventListener(evt, handler, opts);
  const create = (tag, cls = "") => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    return el;
  };

  const isDesktop = () => window.matchMedia("(min-width: 768px)").matches;

  /* -------------------------------------------------------------
   *  Wait for DOM ready
   * ----------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    // --- NEW: flag to suppress click after a drag ---
    let dragJustEnded = false;
    // Main wrapper (assume only one instance on page)
    const wrapper = $qs(".parts-breakout-wrapper");
    if (!wrapper) return; // nothing to do

    // Handle parts breakout selector dropdown
    const dropdown = $qs("#parts-breakout-dropdown");
    if (dropdown) {
      on(dropdown, "change", (e) => {
        const selectedUrl = e.target.value;
        if (selectedUrl) {
          window.location.href = selectedUrl;
        }
      });
    }

    // Detect editor mode (truthy permutations of canEdit)
    const isEditor = !!(
      window.partsBreakoutData &&
      (window.partsBreakoutData.canEdit === true ||
        window.partsBreakoutData.canEdit === 1 ||
        window.partsBreakoutData.canEdit === "1" ||
        window.partsBreakoutData.canEdit === "true")
    );

    // Apply circle color to all hotspots
    const circleColor = window.partsBreakoutData?.circleColor || "#0073aa";
    $qsa(".part-hotspot", wrapper).forEach((hs) => {
      hs.style.setProperty("--circle-color", circleColor);
    });

    /* -----------------------------------------------------------
     *  Loading spinner for viewers (non-editor)
     * --------------------------------------------------------- */
    let spinner = null;
    if (!isEditor) {
      wrapper.classList.add("pb-loading");
      spinner = create("div", "pb-loading-spinner");
      spinner.setAttribute("aria-hidden", "true");
      wrapper.appendChild(spinner);
    }

    /* -----------------------------------------------------------
     *  Canvas overlay for guidelines (replacing previous inline SVG)
     * --------------------------------------------------------- */
    const canvas = create("canvas", "parts-guidelines-canvas");
    canvas.setAttribute("aria-hidden", "true");
    wrapper.appendChild(canvas);
    if (!isEditor) canvas.style.display = "none";

    const ctx = canvas.getContext("2d");

    // Helpers to keep canvas dimensions in sync with wrapper
    const resizeCanvas = () => {
      canvas.width = wrapper.clientWidth;
      canvas.height = wrapper.clientHeight;
    };

    resizeCanvas();

    /* -----------------------------------------------------------
     *  Guidelines data + drawing helpers
     * --------------------------------------------------------- */
    const guidelines = {}; // key = hotspot index, value = {x, y} in percentage (0-100)

    const pxToPercent = (xPx, yPx) => {
      const w = wrapper.clientWidth;
      const h = wrapper.clientHeight;
      return {
        x: Math.round((xPx / w) * 1000) / 10,
        y: Math.round((yPx / h) * 1000) / 10,
      };
    };

    // Snap line endpoint to horizontal or vertical axis relative to hotspot
    const snapToAxis = (hotspotIdx, endX, endY) => {
      const hotspot = $qs(`.part-hotspot[data-index="${hotspotIdx}"]`, wrapper);
      if (!hotspot) return { x: endX, y: endY };
      
      const center = hotspotCenterPx(hotspot);
      const dx = Math.abs(endX - center.x);
      const dy = Math.abs(endY - center.y);
      
      // Snap to the axis with the smaller distance
      if (dx < dy) {
        // Snap horizontally (vertical line)
        return { x: center.x, y: endY };
      } else {
        // Snap vertically (horizontal line)
        return { x: endX, y: center.y };
      }
    };

    // Snap to nearby line endpoints if within threshold
    const snapToNearbyEndpoints = (currentIdx, x, y) => {
      const snapThreshold = 25; // pixels
      let snappedX = x;
      let snappedY = y;
      let minDist = snapThreshold;

      // Check all other line endpoints
      Object.entries(guidelines).forEach(([idx, pos]) => {
        if (idx === currentIdx) return; // skip self

        const otherX = (pos.x / 100) * wrapper.clientWidth;
        const otherY = (pos.y / 100) * wrapper.clientHeight;
        
        const dist = Math.sqrt(
          Math.pow(x - otherX, 2) + Math.pow(y - otherY, 2)
        );

        if (dist < minDist) {
          minDist = dist;
          snappedX = otherX;
          snappedY = otherY;
        }
      });

      return { x: snappedX, y: snappedY };
    };

    const hotspotCenterPx = (hotspot) => {
      const rect = hotspot.getBoundingClientRect();
      const wrapRect = wrapper.getBoundingClientRect();
      return {
        x: rect.left - wrapRect.left + rect.width / 2,
        y: rect.top - wrapRect.top + rect.height / 2,
      };
    };

    const drawLines = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Use dynamic line color from backend
      const lineColor = window.partsBreakoutData?.lineColor || "#0073aa";
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 4;
      ctx.shadowColor = "rgba(0,0,0,0.25)";
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.beginPath();
      $qsa(".part-hotspot", wrapper).forEach((hs) => {
        const idx = hs.dataset.index;
        const line = guidelines[idx];
        if (!line) return;

        const start = hotspotCenterPx(hs);
        const endX = (line.x / 100) * wrapper.clientWidth;
        const endY = (line.y / 100) * wrapper.clientHeight;
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(endX, endY);
      });
      ctx.stroke();
    };

    /* -----------------------------------------------------------
     *  React to viewport OR wrapper size changes
     * --------------------------------------------------------- */
    const handleResize = () => {
      resizeCanvas();
      drawLines();
    };

    // Window resize (viewport)
    window.addEventListener("resize", handleResize);

    // Internal changes (fonts, image loads, admin bar, etc.) that alter wrapper dims
    if ("ResizeObserver" in window) {
      const ro = new ResizeObserver(handleResize);
      ro.observe(wrapper);
    }

    const mainImg = $qs(".parts-breakout-main-image", wrapper);
    if (mainImg) {
      if (mainImg.complete) {
        resizeCanvas();
        drawLines();
      } else {
        on(mainImg, "load", () => {
          resizeCanvas();
          drawLines();
        });
      }
    }

    // Fallback for *all* assets done
    window.addEventListener("load", () => {
      resizeCanvas();
      if (isEditor) {
        drawLines(); // editors need immediate static view
        // Start pulsating animations immediately in editor mode (no load-in animation)
        wrapper.classList.add("pb-animations-ready");
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // ensure blank before viewer animation
      }
      if (!isEditor) {
        // Show guidelines canvas now that assets are ready (no handles for viewers)
        canvas.style.display = "block";
        if (spinner) spinner.remove();

        // The wrapper class is removed here, so the animation can start
        // with the wrapper already in its final state.
        const animateHotspots = () => {
          const hotspots = $qsa(".part-hotspot", wrapper);

          // If no hotspots, start animations immediately
          if (hotspots.length === 0) {
            wrapper.classList.remove("pb-loading");
            wrapper.classList.add("pb-animations-ready");
            return;
          }

          // Capture original dot position (origLeft/Top) and target endpoint (guideline) for each hotspot
          hotspots.forEach((hs) => {
            const idx = hs.dataset.index;
            const guide = guidelines[idx];

            // The original saved position inside the image becomes the final destination.
            hs.dataset.finalLeft = hs.style.left;
            hs.dataset.finalTop  = hs.style.top;

            // The guideline endpoint (dot) becomes the starting position.
            if (guide) {
              hs.dataset.dotLeft = `${guide.x}%`;
              hs.dataset.dotTop  = `${guide.y}%`;
            } else {
              // If no guideline, start and end at the same spot.
              hs.dataset.dotLeft = hs.style.left;
              hs.dataset.dotTop  = hs.style.top;
            }

            // Place hotspot at the dot (outside) and hide it initially.
            hs.style.transition = "none";
            hs.style.opacity = "0";
            hs.style.left = hs.dataset.dotLeft;
            hs.style.top  = hs.dataset.dotTop;
          });

          // Force reflow so the browser registers the starting state before we animate
          void wrapper.offsetWidth;

          // Ensure canvas starts blank so no full lines flash before animation
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Now we can safely reveal the wrapper contents (remove loading class)
          wrapper.classList.remove("pb-loading");

          // Begin the animated cascade – images fly out first.

          const animateGuidelines = () => {
            const duration = 600; // ms for line draw
            const start = performance.now();

            const step = (now) => {
              const t = Math.min(1, (now - start) / duration);
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              // Use dynamic line color from backend
              const lineColor = window.partsBreakoutData?.lineColor || "#0073aa";
              ctx.strokeStyle = lineColor;
              ctx.lineWidth = 4;
              ctx.shadowColor = "rgba(0,0,0,0.25)";
              ctx.shadowBlur = 3;
              ctx.shadowOffsetX = 1;
              ctx.shadowOffsetY = 1;
              ctx.beginPath();

              $qsa(".part-hotspot", wrapper).forEach((hs) => {
                const idx = hs.dataset.index;
                const line = guidelines[idx];
                if (!line) return;

                // The line should originate from the original dot position (static) and extend to the part image.
                const dotLeftPct = parseFloat(hs.dataset.dotLeft);
                const dotTopPct  = parseFloat(hs.dataset.dotTop);

                const startX = (dotLeftPct / 100) * wrapper.clientWidth;
                const startY = (dotTopPct  / 100) * wrapper.clientHeight;

                const endPt = hotspotCenterPx(hs); // current (moving) position of the part image

                const currentX = startX + (endPt.x - startX) * t;
                const currentY = startY + (endPt.y - startY) * t;

                ctx.moveTo(startX, startY);
                ctx.lineTo(currentX, currentY);
              });

              ctx.stroke();

              if (t < 1) {
                requestAnimationFrame(step);
              } else {
                // Ensure a crisp final render and be ready for future resizes
                drawLines();
                // Start pulsating animations in sync after all load-in animations complete
                wrapper.classList.add("pb-animations-ready");
              }
            };

            requestAnimationFrame(step);
          };

          hotspots.forEach((hs, idx) => {
            hs.style.transition = "opacity 0.8s ease-out, left 1s ease-out, top 1s ease-out";

            setTimeout(() => {
              hs.style.opacity = "1";
              hs.style.left = hs.dataset.finalLeft;
              hs.style.top  = hs.dataset.finalTop;

              // After the last hotspot has finished moving, start guideline draw animation
              if (idx === hotspots.length - 1) {
                setTimeout(animateGuidelines, 1100); // wait for transition to settle
              }
            }, idx * 120); // slight stagger (120 ms)
          });
        };

        animateHotspots();
      }
    });

    /* -----------------------------------------------------------
     *  Tooltip positioning util (used by mobile accordion)
     * --------------------------------------------------------- */
    const positionTooltip = (hotspot) => {
      const tooltip = hotspot.querySelector(".part-tooltip");
      const wrapRect = wrapper.getBoundingClientRect();
      if (!tooltip) return;

      // Reset to default (above)
      tooltip.classList.remove("below");
      Object.assign(tooltip.style, {
        left: "50%",
        transform: "translate(-50%, -100%) translateY(-10px)",
      });

      let tipRect = tooltip.getBoundingClientRect();

      // Decide vertical placement
      if (tipRect.top < wrapRect.top) {
        tooltip.classList.add("below");
        Object.assign(tooltip.style, {
          left: "50%",
          transform: "translate(-50%, 0) translateY(10px)",
        });
        tipRect = tooltip.getBoundingClientRect();
      } else if (tipRect.bottom > wrapRect.bottom) {
        tooltip.classList.remove("below");
        Object.assign(tooltip.style, {
          left: "50%",
          transform: "translate(-50%, -100%) translateY(-10px)",
        });
        tipRect = tooltip.getBoundingClientRect();
      }

      // Horizontal nudge
      let deltaLeft = 0;
      if (tipRect.left < wrapRect.left) {
        deltaLeft = wrapRect.left - tipRect.left + 8;
      } else if (tipRect.right > wrapRect.right) {
        deltaLeft = wrapRect.right - tipRect.right - 8;
      }

      let transformString = tooltip.classList.contains("below")
        ? "translate(-50%, 0) translateY(10px)"
        : "translate(-50%, -100%) translateY(-10px)";

      if (deltaLeft !== 0) {
        transformString = transformString.replace(
          "-50%",
          `calc(-50% + ${deltaLeft}px)`
        );
        tooltip.style.setProperty("--arrow-offset", `${-deltaLeft}px`);
      } else {
        tooltip.style.setProperty("--arrow-offset", "0px");
      }

      tooltip.style.transform = transformString;
    };

    /* -----------------------------------------------------------
     *  Initialize guideline data for *viewers* (non-editor)
     * --------------------------------------------------------- */
    if (!isEditor) {
      $qsa(".part-hotspot", wrapper).forEach((hs) => {
        const x = hs.dataset.lineX;
        const y = hs.dataset.lineY;
        if (x !== undefined && y !== undefined && x !== "" && y !== "") {
          guidelines[hs.dataset.index] = { x: parseFloat(x), y: parseFloat(y) };
        }
      });
      drawLines();
      // No endpoint handles for viewers - lines just end naturally
    }

    /* -----------------------------------------------------------
     *  Hover tooltip that follows cursor on desktop
     * --------------------------------------------------------- */
    const cursorTooltip = (() => {
      const el = create("div", "parts-hover-tooltip");
      el.setAttribute("aria-hidden", "true");
      el.innerHTML =
        '<div class="parts-hover-tooltip-title"></div>' +
        '<div class="parts-hover-tooltip-cta">Click here to learn more</div>';
      document.body.appendChild(el);
      return el;
    })();
    cursorTooltip.style.display = "none";

    /* -----------------------------------------------------------
     *  Slide-out overlay (desktop)
     * --------------------------------------------------------- */
    const slideoutOverlay = (() => {
      const overlay = create("div", "parts-slideout-overlay");
      overlay.setAttribute("aria-hidden", "true");
      overlay.innerHTML =
        '<div class="parts-slideout" role="dialog" aria-modal="true">' +
        '<button type="button" class="parts-slideout-close" aria-label="Close">&times;</button>' +
        '<div class="parts-slideout-content"></div>' +
        "</div>";
      document.body.appendChild(overlay);
      return overlay;
    })();

    const openSlideout = (index, title, contentHtml, imgSrc = "") => {
      const contentEl = $qs(".parts-slideout-content", slideoutOverlay);
      contentEl.innerHTML = `<h2>${title}</h2>${contentHtml}`;

      if (isEditor) {
        const editBtn = create("button", "parts-edit-part-btn button-primary");
        editBtn.type = "button";
        editBtn.innerHTML = 'Edit Part <span class="pb-pencil-icon">✎</span>';
        editBtn.style.marginTop = "1rem";
        editBtn.style.display = "block";
        editBtn.style.marginLeft = "auto";
        editBtn.style.alignItems = "center";
        editBtn.style.gap = "6px";
        contentEl.appendChild(editBtn);

        on(editBtn, "click", () => {
          closeSlideout();
          openEditForm(index, title, contentHtml, imgSrc);
        });
      }

      // Add CTA button to the bottom of the sidebar
      if (partsBreakoutData.ctaLabel && partsBreakoutData.ctaUrl) {
        const ctaLink = create("a", "pb-cta-link");
        ctaLink.href = partsBreakoutData.ctaUrl;
        ctaLink.textContent = partsBreakoutData.ctaLabel;
        contentEl.appendChild(ctaLink);
      }

      slideoutOverlay.classList.add("open");
    };

    /**
     * Opens modal to edit an existing part.
     */
    const openEditForm = (index, currentTitle, currentContentHtml, currentImgSrc = "") => {
      let overlay = $qs(".parts-edit-form-overlay");
      if (!overlay) {
        overlay = create("div", "parts-add-form-overlay parts-edit-form-overlay");
        overlay.innerHTML = `
          <div class="parts-add-form" role="dialog" aria-modal="true">
            <button type="button" class="parts-add-close" aria-label="Close">&times;</button>
            <h2>Edit Part</h2>
            <label>Image<br/>
              <div style="display:flex;align-items:center;gap:8px;">
                <img src="" alt="Preview" class="parts-edit-image-preview" style="max-width:80px;max-height:80px;display:none;" />
                <button type="button" class="parts-edit-select-image">Select Image</button>
              </div>
            </label>
            <label style="display:block;margin-top:12px;">Title<br/>
              <input type="text" class="parts-edit-title" required style="width:100%;" />
            </label>
            <label style="display:block;margin-top:12px;">Content<br/>
              <textarea class="parts-edit-content" rows="4"></textarea>
            </label>
            <div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end;">
              <button type="button" class="parts-edit-cancel">Cancel</button>
              <button type="button" class="parts-edit-save button-primary">Update</button>
            </div>
          </div>`;
        document.body.appendChild(overlay);
      }

      overlay.classList.add("open");

      const modalForm    = $qs(".parts-add-form", overlay);
      // Prevent drag initiation when interacting with form controls
      on(modalForm, "mousedown", (evt) => {
        if (evt.target.closest("input, textarea, select, button, .tox")) {
          evt.stopImmediatePropagation();
        }
      });

      const titleInput   = $qs(".parts-edit-title", overlay);
      const contentInput = $qs(".parts-edit-content", overlay);
      const imgPreview   = $qs(".parts-edit-image-preview", overlay);
      const selectBtn    = $qs(".parts-edit-select-image", overlay);

      // Make the form draggable
      makeDraggable(modalForm, {
        container: null,
        cursor: "move",
        onStart() { modalForm.style.position = "fixed"; },
      });

      const closeBtn     = $qs(".parts-add-close", overlay);
      const cancelBtn    = $qs(".parts-edit-cancel", overlay);
      const saveBtn      = $qs(".parts-edit-save", overlay);

      titleInput.value = currentTitle || "";
      contentInput.value = currentContentHtml || "";

      // Handle image preview
      if (currentImgSrc) {
        imgPreview.src = currentImgSrc;
        imgPreview.style.display = "block";
      } else {
        imgPreview.style.display = "none";
      }

      let selectedImageId = 0;

      // Image picker
      selectBtn.onclick = () => {
        if (window.wp && wp.media) {
          let frame = wp.media({ title: "Select Image", multiple: false, library: { type: "image" } });
          frame.on("select", () => {
            const attachment = frame.state().get("selection").first().toJSON();
            selectedImageId = attachment.id;
            imgPreview.src = attachment.url;
            imgPreview.style.display = "block";
          });
          frame.open();
        }
      };

      // Initialize TinyMCE for content textarea if available
      let editorId = "parts-edit-content-" + Date.now();
      contentInput.id = editorId;
      if (window.tinymce) {
        const existing = tinymce.get(editorId);
        if (existing) tinymce.remove(existing);
        const initialContent = currentContentHtml || "";
        tinymce.init({
          selector: `#${editorId}`,
          menubar: true,
          plugins: "lists link image fullscreen",
          toolbar: "undo redo | formatselect | bold italic underline | alignleft aligncenter alignright | bullist numlist | link image | fullscreen",
          height: 300,
          branding: false,
          setup: (ed) => {
            ed.on("init", () => {
              ed.setContent(initialContent);
            });
          },
        });
      }

      const closeOverlay = () => {
        overlay.classList.remove("open");
        if (window.tinymce) {
          const ed = tinymce.get(editorId);
          if (ed) tinymce.remove(ed);
        }
      };

      closeBtn.onclick = cancelBtn.onclick = closeOverlay;

      saveBtn.onclick = () => {
        const t = titleInput.value.trim();
        if (!t) {
          alert("Title is required.");
          return;
        }

        const params = {
          post_id: window.partsBreakoutData.postId,
          index: index,
          part_title: t,
          content: window.tinymce ? (tinymce.get(editorId)?.getContent() || "") : contentInput.value.trim(),
        };

        if (selectedImageId) params.image_id = selectedImageId;

        fetch(window.partsBreakoutData.restUpdateUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-WP-Nonce": window.partsBreakoutData.nonce,
          },
          body: new URLSearchParams(params),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data && data.success) {
              window.location.reload();
            } else {
              alert("Sorry, the part could not be updated.");
            }
          })
          .catch(() => alert("Network error while updating part."));
      };

      // Close when clicking outside dialog
      overlay.addEventListener("click", (evt) => {
        if (evt.target === overlay) closeOverlay();
      });
    }

    const closeSlideout = () => slideoutOverlay.classList.remove("open");

    // Close button
    on(slideoutOverlay, "click", (e) => {
      if (e.target.matches(".parts-slideout-close")) {
        e.preventDefault();
        closeSlideout();
      }
      // Click outside slideout closes
      if (e.target === slideoutOverlay) closeSlideout();
    });

    /* -----------------------------------------------------------
     *  Event delegation helpers (hotspots & accordions)
     * --------------------------------------------------------- */

    // Follow-cursor tooltip positioning
    on(document, "mousemove", (e) => {
      const hotspot = e.target.closest(".part-hotspot");
      if (!hotspot || !isDesktop()) return;
      const offsetY = 20;
      const tooltipWidth = cursorTooltip.offsetWidth;
      const leftPos = e.clientX - tooltipWidth / 2;
      cursorTooltip.style.top = `${e.clientY + offsetY}px`;
      cursorTooltip.style.left = `${leftPos}px`;
    });

    // Hover in (mouse + focus)
    const hotspotEnter = (e) => {
      const hotspot = e.target.closest(".part-hotspot");
      if (!hotspot) return;

      if (!isDesktop()) {
        const tooltip = hotspot.querySelector(".part-tooltip");
        if (tooltip) {
          tooltip.style.display = "block";
          positionTooltip(hotspot);
        }
        return;
      }

      const title = hotspot.querySelector(".part-tooltip-title")?.textContent || "";
      const imgSrc = hotspot.querySelector(".part-hotspot-image")?.src || "";
      $qs(".parts-hover-tooltip-title", cursorTooltip).textContent = title;
      const offsetY = 20;
      const tooltipWidth = cursorTooltip.offsetWidth;
      const leftPos = e.clientX - tooltipWidth / 2;
      cursorTooltip.style.top = `${e.clientY + offsetY}px`;
      cursorTooltip.style.left = `${leftPos}px`;
      cursorTooltip.style.display = "block";
    };

    on(document, "mouseover", hotspotEnter);
    on(document, "focusin", hotspotEnter);

    // Hover out
    const hotspotLeave = (e) => {
      const hotspot = e.target.closest(".part-hotspot");
      if (!hotspot) return;
      if (isDesktop()) {
        cursorTooltip.style.display = "none";
      } else {
        const tooltip = hotspot.querySelector(".part-tooltip");
        if (tooltip) tooltip.style.display = "none";
      }
    };
    on(document, "mouseout", hotspotLeave);
    on(document, "focusout", hotspotLeave);

    // Click on hotspot (desktop => slideout)
    on(document, "click", (e) => {
      const hotspot = e.target.closest(".part-hotspot");
      if (!hotspot) return;
      if (!isDesktop()) return; // allow default for mobile
      // If a drag just ended, prevent navigation but skip slideout
      if (dragJustEnded) {
        e.preventDefault();
        return;
      }
      e.preventDefault();
      const index = parseInt(hotspot.dataset.index || "0", 10);
      const title = hotspot.querySelector(".part-tooltip-title")?.textContent || "";
      const contentClone = hotspot.querySelector(".part-tooltip-inner")?.cloneNode(true);
      if (contentClone) {
        const titleEl = contentClone.querySelector(".part-tooltip-title");
        if (titleEl) titleEl.remove();
      }
      const imgSrc = hotspot.querySelector(".part-hotspot-image")?.src || "";
      openSlideout(index, title, contentClone ? contentClone.innerHTML : "", imgSrc);
      cursorTooltip.style.display = "none";
    });

    // Mobile accordion toggle
    on(document, "click", (e) => {
      const toggle = e.target.closest(".part-accordion-toggle");
      if (!toggle) return;
      e.preventDefault();
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", (!expanded).toString());
      const content = toggle.nextElementSibling;
      if (content) content.hidden = expanded;
    });

    // Close slideout on ESC
    on(document, "keyup", (e) => {
      if (e.key === "Escape") closeSlideout();
    });

    /* -----------------------------------------------------------
     *  DRAG & DROP UTILS  ( custom replacement for jQuery-UI )
     * --------------------------------------------------------- */
    const makeDraggable = (el, {
      container = null,
      onStart = () => {},
      onDrag = () => {},
      onStop = () => {},
      cursor = "move",
    } = {}) => {
      const dragThreshold = 8; // px before we treat the action as a drag
      let dragging = false;
      let startX, startY, origX = 0, origY = 0;
      let moved = false;

      const moveListener = (e) => {
        if (!dragging) return;
        e.preventDefault();
        const pageX = e.touches ? e.touches[0].pageX : e.pageX;
        const pageY = e.touches ? e.touches[0].pageY : e.pageY;
        const dx = pageX - startX;
        const dy = pageY - startY;

        // Haven't crossed the threshold yet?
        if (!moved) {
          if (Math.abs(dx) < dragThreshold && Math.abs(dy) < dragThreshold) {
            return; // still just a click-ish movement
          }
          // Threshold exceeded – activate drag mode
          moved = true;
          const contRect = container ? container.getBoundingClientRect() : { left: 0, top: 0 };
          const elRect = el.getBoundingClientRect();
          origX = elRect.left - contRect.left;
          origY = elRect.top - contRect.top;
          // Switch to pixel positioning
          el.style.left = `${origX}px`;
          el.style.top  = `${origY}px`;
          el.style.transform = "none";
          // Fire onStart only **when real drag begins** so callers can toggle UI affordances smoothly
          onStart();
        }

        // Compute new coordinates
        let newX = origX + dx;
        let newY = origY + dy;

        if (container) {
          const contRect = container.getBoundingClientRect();
          const elRect = el.getBoundingClientRect();
          const maxX = contRect.width - elRect.width;
          const maxY = contRect.height - elRect.height;
          newX = Math.max(0, Math.min(maxX, newX));
          newY = Math.max(0, Math.min(maxY, newY));
        }

        el.style.left = `${newX}px`;
        el.style.top  = `${newY}px`;
        onDrag({ x: newX, y: newY, dragged: true });
      };

      const upListener = () => {
        if (!dragging) return;
        dragging = false;
        document.body.style.cursor = "";
        off(document, "mousemove", moveListener);
        off(document, "touchmove", moveListener);
        off(document, "mouseup", upListener);
        off(document, "touchend", upListener);

        onStop(moved); // pass boolean indicating whether a drag occurred

        if (moved) {
          dragJustEnded = true;
          setTimeout(() => (dragJustEnded = false), 0);
        }
        moved = false;
      };

      const downListener = (e) => {
        if (e.button !== undefined && e.button !== 0) return; // left click only
        e.preventDefault();
        dragging = true;
        startX = e.touches ? e.touches[0].pageX : e.pageX;
        startY = e.touches ? e.touches[0].pageY : e.pageY;
        document.body.style.cursor = cursor;
        // Attach listeners
        on(document, "mousemove", moveListener);
        on(document, "touchmove", moveListener, { passive: false });
        on(document, "mouseup", upListener);
        on(document, "touchend", upListener);
      };

      on(el, "mousedown", downListener);
      on(el, "touchstart", downListener, { passive: false });
    };

    /* -----------------------------------------------------------
     *  EDITOR-ONLY DRAGGABLE HOTSPOTS & GUIDELINES
     * --------------------------------------------------------- */
    if (isEditor) {
      wrapper.classList.add("parts-editing");

      // === Add Part button ===
      const addBtn = create("button", "parts-add-part-btn button-primary");
      addBtn.type = "button";
      addBtn.innerHTML = "Add Part <span class=\"pb-plus-icon\">+</span>";
      addBtn.setAttribute("aria-label", "Add new part");
      wrapper.appendChild(addBtn);

      const openAddForm = () => {
        let overlay = $qs(".parts-add-form-overlay");
        if (!overlay) {
          overlay = create("div", "parts-add-form-overlay");
          overlay.innerHTML = `
            <div class="parts-add-form" role="dialog" aria-modal="true">
              <button type="button" class="parts-add-close" aria-label="Close">&times;</button>
              <h2>Add New Part</h2>
              <label>Image<br/>
                <div style="display:flex;align-items:center;gap:8px;">
                  <img src="" alt="Preview" class="parts-add-image-preview" style="max-width:80px;max-height:80px;display:none;" />
                  <button type="button" class="parts-add-select-image">Select Image</button>
                </div>
              </label>
              <label style="display:block;margin-top:12px;">Title<br/><input type="text" id="parts-add-title" name="part_title" class="parts-add-title" required style="width:100%;"></label>
              <label>Content<br/><textarea class="parts-add-content" rows="4"></textarea></label>
              <div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end;">
                <button type="button" class="parts-add-cancel">Cancel</button>
                <button type="button" class="parts-add-save button-primary">Save</button>
              </div>
            </div>`;
          document.body.appendChild(overlay);
        }

        overlay.classList.add("open");

        const modalForm    = $qs(".parts-add-form", overlay);
        // Prevent drag initiation when interacting with form controls
        on(modalForm, "mousedown", (evt) => {
          if (evt.target.closest("input, textarea, select, button, .tox")) {
            evt.stopImmediatePropagation(); // prevent drag handler from firing
          }
        });
        // Make modal draggable using existing util, fixing jump by switching to fixed positioning at drag start
        makeDraggable(modalForm, {
          container: null, // full viewport
          cursor: "move",
          onStart() {
            modalForm.style.position = "fixed";
          },
        });

        const titleInput   = $qs(".parts-add-title", overlay);
        const contentInput = $qs(".parts-add-content", overlay);
        const imgPreview   = $qs(".parts-add-image-preview", overlay);
        const selectBtn    = $qs(".parts-add-select-image", overlay);
        const closeBtn     = $qs(".parts-add-close", overlay);
        const cancelBtn    = $qs(".parts-add-cancel", overlay);
        const saveBtn      = $qs(".parts-add-save", overlay);

        // Reset fields each time
        titleInput.value = "";
        contentInput.value = "";
        imgPreview.style.display = "none";

        let selectedImageId = 0;
        let frame = null;

        selectBtn.onclick = () => {
          if (frame) {
            frame.open();
            return;
          }
          frame = wp.media({ title: "Select Part Image", multiple: false, library: { type: "image" } });
          frame.on("select", () => {
            const attachment = frame.state().get("selection").first().toJSON();
            selectedImageId = attachment.id;
            imgPreview.src = attachment.url;
            imgPreview.style.display = "block";
          });
          frame.open();
        };

        // Initialize TinyMCE for content textarea if available
        let editorId = "parts-add-content-" + Date.now();
        contentInput.id = editorId;
        if (window.tinymce) {
          // Remove any previous instance on same id
          const existing = tinymce.get(editorId);
          if (existing) tinymce.remove(existing);
          tinymce.init({
            selector: `#${editorId}`,
            menubar: true,
            plugins: "lists link image fullscreen",
            toolbar: "undo redo | formatselect | bold italic underline | alignleft aligncenter alignright | bullist numlist | link image | fullscreen",
            height: 300,
            branding: false,
          });
        }

        const closeOverlay = () => {
          overlay.classList.remove("open");
          if (window.tinymce) {
            const ed = tinymce.get(editorId);
            if (ed) tinymce.remove(ed);
          }
        };

        // Close when clicking overlay background (outside dialog)
        overlay.addEventListener("click", (evt) => {
          if (evt.target === overlay) {
            closeOverlay();
          }
        });

        closeBtn.onclick = cancelBtn.onclick = closeOverlay;

        saveBtn.onclick = () => {
          const t = titleInput.value.trim();
          if (!t) {
            alert("Title is required.");
            return;
          }
          const defaultLeft = 10; // start near top-left
          const defaultTop  = 10;
          const params = {
            post_id: window.partsBreakoutData.postId,
            left: defaultLeft,
            top: defaultTop,
            part_title: t,
            content: window.tinymce ? (tinymce.get(editorId)?.getContent() || "") : contentInput.value.trim(),
            line_x: 50,
            line_y: 50,
          };
          if (selectedImageId) params.image_id = selectedImageId;

          fetch(window.partsBreakoutData.restCreateUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
              "X-WP-Nonce": window.partsBreakoutData.nonce,
            },
            body: new URLSearchParams(params),
          })
            .then((r) => r.json())
            .then((data) => {
              if (data && data.success) {
                window.location.reload();
              } else {
                alert("Sorry, the part could not be created.");
              }
            })
            .catch(() => alert("Network error while creating part."));
        };
      };

      on(addBtn, "click", openAddForm);

      const posIndicator = create("div", "parts-position-indicator");
      wrapper.appendChild(posIndicator);

      // Hotspot draggables
      $qsa(".part-hotspot", wrapper).forEach((hs) => {
        hs.classList.add("parts-draggable");
        // ensure hotspot is absolutely positioned with translate for centre
        const idx = hs.dataset.index;

        makeDraggable(hs, {
          container: wrapper,
          onStart() {
            // Show the position indicator when dragging actually starts
            posIndicator.style.display = "block";
          },
          onDrag(pos) {
            const centreX = pos.x + hs.offsetWidth / 2;
            const centreY = pos.y + hs.offsetHeight / 2;
            const wW = wrapper.clientWidth;
            const wH = wrapper.clientHeight;
            const leftPercent = Math.round(((centreX / wW) * 100) * 10) / 10;
            const topPercent  = Math.round(((centreY / wH) * 100) * 10) / 10;
            posIndicator.textContent = `X: ${leftPercent}%  Y: ${topPercent}%`;
            posIndicator.style.left = `${centreX + 14}px`;
            posIndicator.style.top  = `${centreY + 14}px`;

            // Re-render guidelines so connected line follows hotspot in real time
            drawLines();
          },
          onStop(dragged) {
            posIndicator.style.display = "none";
            if (!dragged) {
              // No drag – nothing to update
              hs.style.transform = "translate(-50%, -50%)";
              return;
            }
            const rect = hs.getBoundingClientRect();
            const wrapRect = wrapper.getBoundingClientRect();
            const centreX = rect.left - wrapRect.left + hs.offsetWidth / 2;
            const centreY = rect.top  - wrapRect.top  + hs.offsetHeight / 2;
            const wW = wrapper.clientWidth;
            const wH = wrapper.clientHeight;
            const leftPercent = Math.round(((centreX / wW) * 100) * 10) / 10;
            const topPercent  = Math.round(((centreY / wH) * 100) * 10) / 10;

            hs.style.left = `${leftPercent}%`;
            hs.style.top  = `${topPercent}%`;
            hs.style.transform = "translate(-50%, -50%)";
            drawLines();

            if (window.partsBreakoutData) {
              fetch(window.partsBreakoutData.restUrl, {
                method: "POST",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                  "X-WP-Nonce": window.partsBreakoutData.nonce,
                },
                body: new URLSearchParams({
                  post_id: window.partsBreakoutData.postId,
                  index: idx,
                  left: leftPercent,
                  top: topPercent,
                }),
              });
            }
          },
        });

        // ------ Remove button (delete part) ------
        const removeBtn = create("button", "parts-remove-btn");
        removeBtn.type = "button";
        removeBtn.innerHTML = "&times;";
        removeBtn.setAttribute("aria-label", "Remove part");
        hs.appendChild(removeBtn);

        on(removeBtn, "click", (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          if (confirm("Are you sure you want to remove this part?")) {
            const handle = $qs(`.parts-line-handle[data-index="${idx}"]`, wrapper);
            if (handle) handle.remove();
            delete guidelines[idx];
            drawLines();
            hs.remove();
            cursorTooltip.style.display = "none";
            if (window.partsBreakoutData) {
              fetch(window.partsBreakoutData.restUrl, {
                method: "POST",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                  "X-WP-Nonce": window.partsBreakoutData.nonce,
                },
                body: new URLSearchParams({
                  post_id: window.partsBreakoutData.postId,
                  index: idx,
                  delete: 1,
                }),
              });
            }
          }
        });
        // ------ end remove button ------
      });

      /* ---------------------------------------
       *  Guideline endpoint draggable handles
       * ------------------------------------- */
      const addLineHandle = (index, xPercent, yPercent) => {
        const handle = create("div", "parts-line-handle");
        handle.dataset.index = index;
        wrapper.appendChild(handle);
        handle.style.left = `${xPercent}%`;
        handle.style.top = `${yPercent}%`;
        handle.style.transform = "translate(-50%, -50%)";

        makeDraggable(handle, {
          container: wrapper,
          onStart() {
            /* no-op – transform switched inside drag helper */
          },
          onDrag(pos) {
            const centreLeft = pos.x + handle.offsetWidth / 2;
            const centreTop  = pos.y + handle.offsetHeight / 2;
            // First, try snapping to nearby endpoints
            let snapped = snapToNearbyEndpoints(index, centreLeft, centreTop);
            // If no nearby endpoint snap occurred, apply axis snapping
            if (snapped.x === centreLeft && snapped.y === centreTop) {
              snapped = snapToAxis(index, centreLeft, centreTop);
            }
            const posPerc = pxToPercent(snapped.x, snapped.y);
            guidelines[index] = posPerc;
            drawLines();
          },
          onStop(dragged) {
            if (!dragged) {
              handle.style.transform = "translate(-50%, -50%)";
              return;
            }
            const rect = handle.getBoundingClientRect();
            const wrapRect = wrapper.getBoundingClientRect();
            const centreLeft = rect.left - wrapRect.left + handle.offsetWidth / 2;
            const centreTop  = rect.top  - wrapRect.top  + handle.offsetHeight / 2;
            // First, try snapping to nearby endpoints
            let snapped = snapToNearbyEndpoints(index, centreLeft, centreTop);
            // If no nearby endpoint snap occurred, apply axis snapping
            if (snapped.x === centreLeft && snapped.y === centreTop) {
              snapped = snapToAxis(index, centreLeft, centreTop);
            }
            const posPerc = pxToPercent(snapped.x, snapped.y);
            guidelines[index] = posPerc;
            handle.style.left = `${posPerc.x}%`;
            handle.style.top  = `${posPerc.y}%`;
            handle.style.transform = "translate(-50%, -50%)";
            drawLines();

            if (window.partsBreakoutData) {
              fetch(window.partsBreakoutData.restUrl, {
                method: "POST",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                  "X-WP-Nonce": window.partsBreakoutData.nonce,
                },
                body: new URLSearchParams({
                  post_id: window.partsBreakoutData.postId,
                  index: index,
                  line_x: posPerc.x,
                  line_y: posPerc.y,
                }),
              });
            }
          },
        });
      };

      // Existing guidelines + handles
      $qsa(".part-hotspot", wrapper).forEach((hs) => {
        const idx = hs.dataset.index;
        const x = hs.dataset.lineX;
        const y = hs.dataset.lineY;
        if (x !== undefined && y !== undefined && x !== "" && y !== "") {
          guidelines[idx] = { x: parseFloat(x), y: parseFloat(y) };
          addLineHandle(idx, parseFloat(x), parseFloat(y));
          drawLines();
        }
      });
    }
  });
})(); 