// Fallback Chart implementation for when CDN fails to load
(function () {
  console.log("ReportsChartFallback.js: Loading fallback Chart implementation");

  // Always implement the fallback since this file is only loaded when Chart.js fails
  console.warn("Chart.js not found, implementing fallback visualization");

  // Simple Chart class that renders alternative visualizations
  window.Chart = class FallbackChart {
    constructor(ctx, config) {
      console.log("FallbackChart: Creating fallback chart", config.type);
      this.ctx = ctx;
      this.config = config;
      this.render();
    }

    render() {
      if (!this.ctx) {
        console.error("FallbackChart: No context provided");
        return;
      }

      const canvas = this.ctx.canvas;
      if (!canvas) {
        console.error("FallbackChart: No canvas found in context");
        return;
      }

      const container = canvas.parentNode;
      const type = this.config.type;
      const data = this.config.data;

      // Create a simple fallback visualization
      const fallbackDiv = document.createElement("div");
      fallbackDiv.className = "fallback-chart-container";
      fallbackDiv.style.width = "100%";
      fallbackDiv.style.height = "100%";
      fallbackDiv.style.display = "flex";
      fallbackDiv.style.flexDirection = "column";
      fallbackDiv.style.alignItems = "center";
      fallbackDiv.style.justifyContent = "center";

      // Create title
      const title = document.createElement("h4");
      title.textContent = `${
        type.charAt(0).toUpperCase() + type.slice(1)
      } Chart (Fallback Mode)`;
      title.style.margin = "0 0 10px 0";
      fallbackDiv.appendChild(title);

      // Create data representation based on chart type
      if (type === "bar" || type === "line") {
        this.createBarFallback(fallbackDiv, data);
      } else if (type === "pie" || type === "doughnut") {
        this.createPieFallback(fallbackDiv, data);
      } else {
        const message = document.createElement("div");
        message.textContent = "Chart visualization not available for this type";
        fallbackDiv.appendChild(message);
      }

      // Replace canvas with our fallback
      canvas.style.display = "none";
      container.appendChild(fallbackDiv);
    }

    createBarFallback(container, data) {
      const barsContainer = document.createElement("div");
      barsContainer.style.display = "flex";
      barsContainer.style.alignItems = "flex-end";
      barsContainer.style.justifyContent = "space-between";
      barsContainer.style.width = "100%";
      barsContainer.style.height = "200px";

      if (data.labels && data.datasets && data.datasets.length > 0) {
        const dataset = data.datasets[0];
        const values = dataset.data;
        const maxValue = Math.max(...values.filter((v) => !isNaN(v)), 1);

        data.labels.forEach((label, i) => {
          const value = values[i] || 0;
          const percentage = ((value / maxValue) * 100).toFixed(0);

          const barWrapper = document.createElement("div");
          barWrapper.style.display = "flex";
          barWrapper.style.flexDirection = "column";
          barWrapper.style.alignItems = "center";
          barWrapper.style.flex = "1";

          const barValue = document.createElement("div");
          barValue.textContent = value;
          barValue.style.fontSize = "12px";
          barValue.style.marginBottom = "5px";

          const bar = document.createElement("div");
          bar.style.width = "80%";
          bar.style.height = `${percentage}%`;
          bar.style.backgroundColor =
            dataset.backgroundColor instanceof Array
              ? dataset.backgroundColor[i % dataset.backgroundColor.length]
              : dataset.backgroundColor || "#4338ca";
          bar.style.minHeight = "5px";
          bar.style.borderRadius = "3px 3px 0 0";

          const barLabel = document.createElement("div");
          barLabel.textContent = label;
          barLabel.style.fontSize = "12px";
          barLabel.style.marginTop = "5px";
          barLabel.style.textAlign = "center";
          barLabel.style.wordBreak = "break-word";

          barWrapper.appendChild(barValue);
          barWrapper.appendChild(bar);
          barWrapper.appendChild(barLabel);
          barsContainer.appendChild(barWrapper);
        });
      } else {
        barsContainer.textContent = "No data available";
      }

      container.appendChild(barsContainer);
    }

    createPieFallback(container, data) {
      const tableContainer = document.createElement("div");
      tableContainer.style.maxWidth = "100%";
      tableContainer.style.overflow = "auto";

      if (data.labels && data.datasets && data.datasets.length > 0) {
        const dataset = data.datasets[0];
        const values = dataset.data;
        const total = values.reduce((sum, val) => sum + (val || 0), 0);

        const table = document.createElement("table");
        table.style.width = "100%";
        table.style.borderCollapse = "collapse";

        // Table header
        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");

        const labelHeader = document.createElement("th");
        labelHeader.textContent = "Label";
        labelHeader.style.padding = "8px";
        labelHeader.style.textAlign = "left";

        const valueHeader = document.createElement("th");
        valueHeader.textContent = "Value";
        valueHeader.style.padding = "8px";
        valueHeader.style.textAlign = "right";

        const percentHeader = document.createElement("th");
        percentHeader.textContent = "%";
        percentHeader.style.padding = "8px";
        percentHeader.style.textAlign = "right";

        headerRow.appendChild(labelHeader);
        headerRow.appendChild(valueHeader);
        headerRow.appendChild(percentHeader);
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Table body
        const tbody = document.createElement("tbody");

        data.labels.forEach((label, i) => {
          const value = values[i] || 0;
          const percentage =
            total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";

          const row = document.createElement("tr");

          // Add color indicator
          const colorCell = document.createElement("td");
          colorCell.style.width = "3px";
          colorCell.style.padding = "0";

          // Get color from dataset if available
          let color = "#ccc";
          if (dataset.backgroundColor) {
            if (Array.isArray(dataset.backgroundColor)) {
              color =
                dataset.backgroundColor[i % dataset.backgroundColor.length];
            } else {
              color = dataset.backgroundColor;
            }
          }

          colorCell.style.backgroundColor = color;

          const labelCell = document.createElement("td");
          labelCell.textContent = label;
          labelCell.style.padding = "8px";

          const valueCell = document.createElement("td");
          valueCell.textContent = value;
          valueCell.style.padding = "8px";
          valueCell.style.textAlign = "right";

          const percentCell = document.createElement("td");
          percentCell.textContent = `${percentage}%`;
          percentCell.style.padding = "8px";
          percentCell.style.textAlign = "right";

          row.appendChild(colorCell);
          row.appendChild(labelCell);
          row.appendChild(valueCell);
          row.appendChild(percentCell);
          tbody.appendChild(row);
        });

        table.appendChild(tbody);
        tableContainer.appendChild(table);
      } else {
        tableContainer.textContent = "No data available";
      }

      container.appendChild(tableContainer);
    }

    destroy() {
      // Clean up any DOM elements we created
      if (this.ctx && this.ctx.canvas) {
        const canvas = this.ctx.canvas;
        const container = canvas.parentNode;

        // Find and remove our fallback div
        if (container) {
          const fallbacks = container.querySelectorAll(
            ".fallback-chart-container"
          );
          fallbacks.forEach((el) => container.removeChild(el));

          // Make the canvas visible again
          canvas.style.display = "block";
        }
      }
    }

    // Add compatibility with common Chart.js methods
    update() {
      // No-op, since our fallback doesn't support updates
      console.log("FallbackChart: update called (no-op)");
      return this;
    }

    resize() {
      // No-op, since our fallback doesn't need resizing
      console.log("FallbackChart: resize called (no-op)");
      return this;
    }
  };

  // Make it available at window.ChartInstance as well for compatibility
  window.ChartInstance = window.Chart;

  // Update global flag to indicate Chart is now available
  window.ChartLoaded = true;

  console.log("Fallback Chart.js implementation loaded successfully");
})();
