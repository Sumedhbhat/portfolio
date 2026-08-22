import * as d3 from "d3";
import { useEffect, useMemo, useRef, useState } from "react";
import { portfolio } from "../../data/portfolio";
import { buildGraph, graphNodeId, graphTypeLabels, type GraphLink, type GraphNode, type GraphNodeType } from "./buildGraph";

const allTypes = Object.keys(graphTypeLabels) as GraphNodeType[];

export function CareerGraph() {
  const graph = useMemo(() => buildGraph(portfolio), []);
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const controlsRef = useRef({ zoomIn: () => {}, zoomOut: () => {}, reset: () => {} });
  const selectNodeRef = useRef<(id: string) => void>(() => {});
  const [hiddenTypes, setHiddenTypes] = useState<Set<GraphNodeType>>(new Set());
  const [selectedId, setSelectedId] = useState<string>();
  const [status, setStatus] = useState("Mapping connections");

  const visibleNodes = graph.nodes.filter((node) => !hiddenTypes.has(node.type));
  const visibleIds = new Set(visibleNodes.map((node) => node.id));
  const visibleLinks = graph.links.filter((link) => visibleIds.has(graphNodeId(link.source)) && visibleIds.has(graphNodeId(link.target)));

  useEffect(() => {
    const canvas = canvasRef.current;
    const svgElement = svgRef.current;
    if (!canvas || !svgElement) return;

    const nodes = visibleNodes.map((node) => ({ ...node }));
    const links = visibleLinks.map((link) => ({ ...link, source: graphNodeId(link.source), target: graphNodeId(link.target) }));
    let width = canvas.clientWidth;
    let height = canvas.clientHeight;
    const svg = d3.select(svgElement);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`);
    const background = svg.append("rect").attr("width", width).attr("height", height).attr("fill", "transparent");
    const viewport = svg.append("g");
    const linkLayer = viewport.append("g").attr("aria-hidden", "true");
    const nodeLayer = viewport.append("g");
    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([.25, 3]).on("zoom", (event) => viewport.attr("transform", event.transform));
    svg.call(zoom).on("dblclick.zoom", null);

    const linkForce = d3.forceLink<GraphNode, GraphLink>(links).id((node) => node.id).distance((link) => link.relation === "uses" ? 62 : link.relation === "works with" ? 125 : 90).strength(.65);
    const simulation = d3.forceSimulation(nodes)
      .force("link", linkForce)
      .force("charge", d3.forceManyBody<GraphNode>().strength((node) => node.type === "technology" ? -42 : -125))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX(width / 2).strength(.025))
      .force("y", d3.forceY(height / 2).strength(.025))
      .force("collision", d3.forceCollide<GraphNode>().radius((node) => node.radius + 7).iterations(2));

    nodes.forEach((node, index) => {
      const angle = (index / nodes.length) * Math.PI * 2;
      const distance = 55 + (index % 7) * 16;
      node.x = width / 2 + Math.cos(angle) * distance;
      node.y = height / 2 + Math.sin(angle) * distance;
    });

    const linkSelection = linkLayer.selectAll<SVGLineElement, GraphLink>("line").data(links, (link) => link.id).join("line").attr("class", "g-edge");
    const nodeSelection = nodeLayer.selectAll<SVGGElement, GraphNode>("g").data(nodes, (node) => node.id).join((enter) => {
      const group = enter.append("g").attr("class", "g-node").attr("tabindex", 0).attr("role", "button");
      group.append("circle").attr("class", "g-node-hit");
      group.append("circle").attr("class", "g-node-core");
      group.append("text").attr("class", "g-node-label").attr("dominant-baseline", "middle");
      return group;
    });

    const selectNode = (node: GraphNode) => {
      setSelectedId(node.id);
      const connected = connectedIds(graph.links, node.id);
      nodeSelection.classed("is-selected", (candidate) => candidate.id === node.id).classed("is-dimmed", (candidate) => !connected.has(candidate.id));
      linkSelection.classed("is-dimmed", (link) => graphNodeId(link.source) !== node.id && graphNodeId(link.target) !== node.id);
    };
    const clearSelection = () => {
      setSelectedId(undefined);
      nodeSelection.classed("is-selected", false).classed("is-dimmed", false);
      linkSelection.classed("is-dimmed", false);
    };
    selectNodeRef.current = (id) => {
      const node = nodes.find((candidate) => candidate.id === id);
      if (node) selectNode(node);
    };

    const drag = d3.drag<SVGGElement, GraphNode>()
      .on("start", (event, node) => { if (!event.active) simulation.alphaTarget(.2).restart(); node.fx = node.x; node.fy = node.y; })
      .on("drag", (event, node) => { node.fx = event.x; node.fy = event.y; })
      .on("end", (event, node) => { if (!event.active) simulation.alphaTarget(0); node.fx = null; node.fy = null; });

    nodeSelection
      .attr("data-type", (node) => node.type)
      .attr("aria-label", (node) => `${graphTypeLabels[node.type]}: ${node.label}`)
      .on("click", (event, node) => { event.stopPropagation(); selectNode(node); })
      .on("keydown", (event, node) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectNode(node); } })
      .call(drag);
    nodeSelection.select<SVGCircleElement>(".g-node-hit").attr("r", (node) => Math.max(16, node.radius + 6));
    nodeSelection.select<SVGCircleElement>(".g-node-core").attr("r", (node) => node.radius);
    nodeSelection.select<SVGTextElement>(".g-node-label").attr("x", (node) => node.radius + 5).text((node) => node.label.length > 27 ? `${node.label.slice(0, 26)}…` : node.label);
    background.on("click", clearSelection);

    simulation.on("tick", () => {
      linkSelection.attr("x1", (link) => graphNodePosition(link.source).x ?? 0).attr("y1", (link) => graphNodePosition(link.source).y ?? 0).attr("x2", (link) => graphNodePosition(link.target).x ?? 0).attr("y2", (link) => graphNodePosition(link.target).y ?? 0);
      nodeSelection.attr("transform", (node) => `translate(${node.x ?? 0},${node.y ?? 0})`);
    });

    controlsRef.current = {
      zoomIn: () => { void svg.transition().duration(180).call(zoom.scaleBy, 1.25); },
      zoomOut: () => { void svg.transition().duration(180).call(zoom.scaleBy, .8); },
      reset: () => { clearSelection(); void svg.transition().duration(220).call(zoom.transform, d3.zoomIdentity); simulation.alpha(.45).restart(); },
    };

    const observer = new ResizeObserver(() => {
      width = canvas.clientWidth; height = canvas.clientHeight;
      svg.attr("viewBox", `0 0 ${width} ${height}`); background.attr("width", width).attr("height", height);
      simulation.force("center", d3.forceCenter(width / 2, height / 2)); simulation.alpha(.25).restart();
    });
    observer.observe(canvas);
    setStatus("Graph ready");
    return () => { simulation.stop(); observer.disconnect(); selectNodeRef.current = () => {}; };
  }, [hiddenTypes]);

  const selected = selectedId ? graph.nodeById.get(selectedId) : undefined;
  const neighbors = selected ? [...connectedIds(graph.links, selected.id)].filter((id) => id !== selected.id).map((id) => graph.nodeById.get(id)).filter((node): node is GraphNode => Boolean(node) && !hiddenTypes.has(node!.type)).slice(0, 14) : [];

  function toggleType(type: GraphNodeType) {
    setHiddenTypes((current) => { const next = new Set(current); if (next.has(type)) next.delete(type); else next.add(type); return next; });
    if (selected?.type === type) setSelectedId(undefined);
  }

  return (
    <div className="layout-g"><div className="g-shell">
      <nav className="g-nav"><strong>{portfolio.profile.name} / Career Graph</strong><div><span className="g-status is-ready" role="status">{status}</span><a href={`mailto:${portfolio.profile.email}`}>Contact</a></div></nav>
      <main className="g-workbench">
        <aside aria-label="Graph controls and selected node" className="g-sidebar">
          <div className="g-sidebar-head"><h2>Graph index</h2><span className="g-count">{visibleNodes.length} nodes · {visibleLinks.length} links</span></div>
          <div><span className="g-filter-title">Show nodes</span><div className="g-filters">{allTypes.map((type) => <button aria-pressed={!hiddenTypes.has(type)} className="g-filter" data-type={type} key={type} onClick={() => toggleType(type)} type="button"><span>{graphTypeLabels[type]}</span><span>{graph.nodes.filter((node) => node.type === type).length}</span></button>)}</div></div>
          <div className="g-detail">
            {selected ? <><small>{graphTypeLabels[selected.type]}</small><h3>{selected.label}</h3><p className="g-detail-meta">{selected.meta}</p><p className="g-detail-copy">{selected.description}</p>{neighbors.length > 0 && <div className="g-neighbors">{neighbors.map((node) => <button className="g-neighbor" key={node.id} onClick={() => selectNodeRef.current(node.id)} type="button">{node.label}</button>)}</div>}</> : <><small>Explore</small><h3>Select a node</h3><p className="g-detail-copy">Choose any point to isolate its immediate relationships. Drag nodes to rearrange the map; scroll or pinch to zoom.</p></>}
          </div>
        </aside>
        <section className="g-canvas" ref={canvasRef}>
          <svg aria-label="Interactive career graph" className="g-svg" ref={svgRef} role="img" />
          <div className="g-controls"><button className="g-control" onClick={() => controlsRef.current.zoomIn()} type="button">+</button><button className="g-control" onClick={() => controlsRef.current.zoomOut()} type="button">−</button><button className="g-control" onClick={() => controlsRef.current.reset()} type="button">Reset</button></div>
          <p className="g-canvas-note">Drag nodes · scroll to zoom · select to isolate</p>
        </section>
      </main>
    </div></div>
  );
}

function connectedIds(links: GraphLink[], id: string) {
  const ids = new Set([id]);
  links.forEach((link) => { const source = graphNodeId(link.source); const target = graphNodeId(link.target); if (source === id) ids.add(target); if (target === id) ids.add(source); });
  return ids;
}

function graphNodePosition(value: string | GraphNode) {
  return typeof value === "string" ? { x: 0, y: 0 } : value;
}
