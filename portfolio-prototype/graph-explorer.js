(function () {
  const D3_URL = "https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js";
  const TYPE_LABELS = {
    person: "Person",
    company: "Company",
    position: "Position",
    work: "Work point",
    project: "Project",
    technology: "Technology",
    recognition: "Recognition",
    education: "Education",
  };
  const RADII = {
    person: 15,
    company: 11,
    position: 9,
    work: 7,
    project: 8,
    technology: 5,
    recognition: 7,
    education: 8,
  };

  let d3Promise;
  let activeGraph;

  function loadD3() {
    if (window.d3) return Promise.resolve(window.d3);
    if (d3Promise) return d3Promise;
    d3Promise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = D3_URL;
      script.onload = () => resolve(window.d3);
      script.onerror = () => reject(new Error("The graph library could not be loaded."));
      document.head.append(script);
    });
    return d3Promise;
  }

  function formatMonth(value) {
    if (!value) return "Present";
    return new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(
      new Date(`${value}T00:00:00`),
    );
  }

  function buildGraph(data) {
    const nodes = [];
    const links = [];
    const nodeById = new Map();
    const edgeIds = new Set();

    function addNode(node) {
      if (nodeById.has(node.id)) return nodeById.get(node.id);
      const complete = { ...node, radius: RADII[node.type] };
      nodes.push(complete);
      nodeById.set(complete.id, complete);
      return complete;
    }

    function addLink(source, target, relation) {
      const id = `${source}|${relation}|${target}`;
      if (edgeIds.has(id)) return;
      edgeIds.add(id);
      links.push({ id, source, target, relation });
    }

    const personId = "person:sumedh";
    addNode({
      id: personId,
      type: "person",
      label: data.profile.name,
      meta: `${data.profile.role} · ${data.profile.location}`,
      description: data.profile.summary,
    });

    data.companies.forEach((company) => {
      const id = `company:${company.id}`;
      addNode({
        id,
        type: "company",
        label: company.name,
        meta: company.location,
        description: company.description,
      });
    });

    data.positions.forEach((position) => {
      const id = `position:${position.id}`;
      addNode({
        id,
        type: "position",
        label: position.title,
        meta: `${formatMonth(position.startDate)} — ${formatMonth(position.endDate)}`,
        description: `Role progression at ${data.companies.find((company) => company.id === position.companyId)?.name || "the company"}.`,
      });
      addLink(personId, id, "held role");
      addLink(id, `company:${position.companyId}`, "at");
    });

    function technologyId(label) {
      return `technology:${label.trim().toLocaleLowerCase()}`;
    }

    function addTechnology(label) {
      const cleanLabel = label.trim();
      const id = technologyId(cleanLabel);
      addNode({
        id,
        type: "technology",
        label: cleanLabel,
        meta: "Technology or practice",
        description: `Connected wherever ${cleanLabel} appears in the résumé or project record.`,
      });
      return id;
    }

    data.professional.forEach((work, index) => {
      const id = `work:${index + 1}`;
      addNode({
        id,
        type: "work",
        label: work.title,
        meta: `${work.year} · ${work.status}`,
        description: `${work.description} ${work.impact}`,
      });
      addLink(`company:${work.companyId}`, id, "shipped");
      work.tags.forEach((tag) => addLink(id, addTechnology(tag), "uses"));
    });

    data.publicProjects.forEach((project, index) => {
      const id = `project:${index + 1}`;
      addNode({
        id,
        type: "project",
        label: project.title,
        meta: `${project.kind} · ${project.status}`,
        description: project.description,
      });
      addLink(personId, id, "built");
      project.tags.forEach((tag) => addLink(id, addTechnology(tag), "uses"));
    });

    data.skills.forEach((group) => {
      group.items.split(",").map((item) => item.trim()).filter(Boolean).forEach((item) => {
        addLink(personId, addTechnology(item), "works with");
      });
    });

    data.recognition.forEach((recognition, index) => {
      const id = `recognition:${index + 1}`;
      addNode({
        id,
        type: "recognition",
        label: recognition.title,
        meta: recognition.year,
        description: recognition.note,
      });
      addLink(personId, id, "earned");
      if (/MRI Software/i.test(recognition.title)) addLink(id, "company:1", "awarded by");
    });

    const educationId = "education:nmit";
    addNode({
      id: educationId,
      type: "education",
      label: "Nitte Meenakshi Institute of Technology",
      meta: "BE Computer Science · 2019—2023",
      description: "Bachelor of Engineering in Computer Science and Engineering · CGPA 9.09.",
    });
    addLink(personId, educationId, "studied at");

    return { nodes, links, nodeById };
  }

  function nodeId(value) {
    return typeof value === "object" ? value.id : value;
  }

  function truncate(value, length = 27) {
    return value.length > length ? `${value.slice(0, length - 1)}…` : value;
  }

  function setStatus(text, state) {
    const status = document.getElementById("g-status");
    if (!status) return;
    status.textContent = text;
    status.classList.toggle("is-ready", state === "ready");
    status.classList.toggle("is-error", state === "error");
  }

  window.destroyCareerGraph = function destroyCareerGraph() {
    if (!activeGraph) return;
    activeGraph.simulation.stop();
    activeGraph.resizeObserver.disconnect();
    activeGraph = undefined;
  };

  window.activateCareerGraph = async function activateCareerGraph(data) {
    const root = document.querySelector(".layout-g");
    const canvasElement = document.getElementById("g-canvas");
    const svgElement = document.getElementById("g-svg");
    const detailElement = document.getElementById("g-detail");
    const tooltipElement = document.getElementById("g-tooltip");
    if (!root || !canvasElement || !svgElement || !detailElement || !tooltipElement) return;

    try {
      const d3 = await loadD3();
      if (!document.body.contains(root)) return;

      const graph = buildGraph(data);
      const hiddenTypes = new Set();
      let selectedId;
      let width = canvasElement.clientWidth;
      let height = canvasElement.clientHeight;
      let linkSelection;
      let nodeSelection;

      const svg = d3.select(svgElement).attr("viewBox", `0 0 ${width} ${height}`);
      const background = svg.append("rect").attr("width", width).attr("height", height).attr("fill", "transparent");
      const viewport = svg.append("g");
      const linkLayer = viewport.append("g").attr("aria-hidden", "true");
      const nodeLayer = viewport.append("g");

      const zoom = d3.zoom().scaleExtent([0.25, 3]).on("zoom", (event) => {
        viewport.attr("transform", event.transform);
      });
      svg.call(zoom).on("dblclick.zoom", null);

      const linkForce = d3.forceLink([]).id((node) => node.id).distance((link) => {
        if (link.relation === "uses") return 62;
        if (link.relation === "works with") return 125;
        if (link.relation === "at") return 68;
        return 100;
      }).strength(0.65);
      const simulation = d3.forceSimulation([])
        .force("link", linkForce)
        .force("charge", d3.forceManyBody().strength((node) => node.type === "technology" ? -42 : -125))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("x", d3.forceX(width / 2).strength(0.025))
        .force("y", d3.forceY(height / 2).strength(0.025))
        .force("collision", d3.forceCollide().radius((node) => node.radius + 7).iterations(2));

      graph.nodes.forEach((node, index) => {
        const angle = (index / graph.nodes.length) * Math.PI * 2;
        const distance = 55 + (index % 7) * 16;
        node.x = width / 2 + Math.cos(angle) * distance;
        node.y = height / 2 + Math.sin(angle) * distance;
      });

      const drag = d3.drag()
        .on("start", (event, node) => {
          if (!event.active) simulation.alphaTarget(0.2).restart();
          node.fx = node.x;
          node.fy = node.y;
        })
        .on("drag", (event, node) => {
          node.fx = event.x;
          node.fy = event.y;
        })
        .on("end", (event, node) => {
          if (!event.active) simulation.alphaTarget(0);
          node.fx = null;
          node.fy = null;
        });

      function visibleLinks() {
        return graph.links.filter((link) => {
          const source = graph.nodeById.get(nodeId(link.source));
          const target = graph.nodeById.get(nodeId(link.target));
          return source && target && !hiddenTypes.has(source.type) && !hiddenTypes.has(target.type);
        });
      }

      function connectedIds(id) {
        const ids = new Set([id]);
        graph.links.forEach((link) => {
          const source = nodeId(link.source);
          const target = nodeId(link.target);
          if (source === id) ids.add(target);
          if (target === id) ids.add(source);
        });
        return ids;
      }

      function showTooltip(event, node) {
        const bounds = canvasElement.getBoundingClientRect();
        tooltipElement.textContent = `${TYPE_LABELS[node.type]} · ${node.label}`;
        tooltipElement.style.left = `${event.clientX - bounds.left}px`;
        tooltipElement.style.top = `${event.clientY - bounds.top}px`;
        tooltipElement.classList.add("is-visible");
      }

      function hideTooltip() {
        tooltipElement.classList.remove("is-visible");
      }

      function renderDetail(node) {
        detailElement.replaceChildren();
        const type = document.createElement("small");
        type.textContent = TYPE_LABELS[node.type];
        const title = document.createElement("h3");
        title.textContent = node.label;
        const meta = document.createElement("p");
        meta.className = "g-detail-meta";
        meta.textContent = node.meta || "";
        const copy = document.createElement("p");
        copy.className = "g-detail-copy";
        copy.textContent = node.description || "";
        detailElement.append(type, title, meta, copy);

        const neighbors = [...connectedIds(node.id)]
          .filter((id) => id !== node.id)
          .map((id) => graph.nodeById.get(id))
          .filter((neighbor) => neighbor && !hiddenTypes.has(neighbor.type));
        if (!neighbors.length) return;

        const neighborList = document.createElement("div");
        neighborList.className = "g-neighbors";
        neighbors.slice(0, 14).forEach((neighbor) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "g-neighbor";
          button.textContent = neighbor.label;
          button.addEventListener("click", () => selectNode(neighbor));
          neighborList.append(button);
        });
        detailElement.append(neighborList);
      }

      function clearSelection() {
        selectedId = undefined;
        nodeSelection?.classed("is-selected", false).classed("is-dimmed", false);
        linkSelection?.classed("is-dimmed", false);
        detailElement.innerHTML = "<small>Explore</small><h3>Select a node</h3><p class=\"g-detail-copy\">Choose any point to isolate its immediate relationships. Drag nodes to rearrange the map; scroll or pinch to zoom.</p>";
      }

      function selectNode(node) {
        selectedId = node.id;
        const connected = connectedIds(node.id);
        nodeSelection
          .classed("is-selected", (candidate) => candidate.id === node.id)
          .classed("is-dimmed", (candidate) => !connected.has(candidate.id));
        linkSelection.classed("is-dimmed", (link) => {
          return nodeId(link.source) !== node.id && nodeId(link.target) !== node.id;
        });
        renderDetail(node);
      }

      function render() {
        const visibleNodes = graph.nodes.filter((node) => !hiddenTypes.has(node.type));
        const visibleIds = new Set(visibleNodes.map((node) => node.id));
        const links = graph.links
          .filter((link) => visibleIds.has(nodeId(link.source)) && visibleIds.has(nodeId(link.target)))
          .map((link) => ({ ...link, source: nodeId(link.source), target: nodeId(link.target) }));

        linkSelection = linkLayer.selectAll("line")
          .data(links, (link) => link.id)
          .join("line")
          .attr("class", "g-edge");

        nodeSelection = nodeLayer.selectAll("g")
          .data(visibleNodes, (node) => node.id)
          .join((enter) => {
            const group = enter.append("g")
              .attr("class", "g-node")
              .attr("tabindex", 0)
              .attr("role", "button");
            group.append("circle").attr("class", "g-node-hit");
            group.append("circle").attr("class", "g-node-core");
            group.append("text").attr("class", "g-node-label").attr("dominant-baseline", "middle");
            return group;
          });

        nodeSelection
          .attr("data-type", (node) => node.type)
          .attr("aria-label", (node) => `${TYPE_LABELS[node.type]}: ${node.label}`)
          .on("click", (event, node) => {
            event.stopPropagation();
            selectNode(node);
          })
          .on("keydown", (event, node) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              selectNode(node);
            }
          })
          .on("pointerenter", showTooltip)
          .on("pointermove", showTooltip)
          .on("pointerleave", hideTooltip)
          .call(drag);

        nodeSelection.select(".g-node-hit").attr("r", (node) => Math.max(16, node.radius + 6));
        nodeSelection.select(".g-node-core").attr("r", (node) => node.radius);
        nodeSelection.select(".g-node-label")
          .attr("x", (node) => node.radius + 5)
          .text((node) => truncate(node.label));

        simulation.nodes(visibleNodes);
        linkForce.links(links);
        simulation.alpha(0.9).restart();

        if (selectedId && visibleIds.has(selectedId)) selectNode(graph.nodeById.get(selectedId));
        else if (selectedId) clearSelection();

        document.getElementById("g-count").textContent = `${visibleNodes.length} nodes · ${links.length} links`;
      }

      simulation.on("tick", () => {
        linkSelection
          ?.attr("x1", (link) => link.source.x)
          .attr("y1", (link) => link.source.y)
          .attr("x2", (link) => link.target.x)
          .attr("y2", (link) => link.target.y);
        nodeSelection?.attr("transform", (node) => `translate(${node.x},${node.y})`);
      });

      background.on("click", clearSelection);
      document.getElementById("g-zoom-in").addEventListener("click", () => {
        svg.transition().duration(180).call(zoom.scaleBy, 1.25);
      });
      document.getElementById("g-zoom-out").addEventListener("click", () => {
        svg.transition().duration(180).call(zoom.scaleBy, 0.8);
      });
      document.getElementById("g-reset").addEventListener("click", () => {
        clearSelection();
        svg.transition().duration(220).call(zoom.transform, d3.zoomIdentity);
        simulation.alpha(0.45).restart();
      });

      document.querySelectorAll(".g-filter").forEach((button) => {
        const type = button.dataset.type;
        const count = graph.nodes.filter((node) => node.type === type).length;
        button.lastElementChild.textContent = count;
        button.addEventListener("click", () => {
          if (hiddenTypes.has(type)) hiddenTypes.delete(type);
          else hiddenTypes.add(type);
          button.setAttribute("aria-pressed", String(!hiddenTypes.has(type)));
          render();
        });
      });

      const resizeObserver = new ResizeObserver(() => {
        width = canvasElement.clientWidth;
        height = canvasElement.clientHeight;
        svg.attr("viewBox", `0 0 ${width} ${height}`);
        background.attr("width", width).attr("height", height);
        simulation.force("center", d3.forceCenter(width / 2, height / 2));
        simulation.force("x", d3.forceX(width / 2).strength(0.025));
        simulation.force("y", d3.forceY(height / 2).strength(0.025));
        simulation.alpha(0.25).restart();
      });
      resizeObserver.observe(canvasElement);

      activeGraph = { simulation, resizeObserver };
      render();
      setStatus("Graph ready", "ready");
    } catch (error) {
      setStatus("Graph unavailable", "error");
      detailElement.innerHTML = "<small>Graph unavailable</small><h3>Could not build the map</h3>";
      const message = document.createElement("p");
      message.className = "g-detail-copy";
      message.textContent = error instanceof Error ? error.message : String(error);
      detailElement.append(message);
    }
  };
})();
