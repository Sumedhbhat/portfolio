import type { PortfolioData } from "../../data/types";

export const graphTypeLabels = {
  person: "Person",
  company: "Company",
  position: "Position",
  work: "Work point",
  project: "Project",
  technology: "Technology",
  recognition: "Recognition",
  education: "Education",
} as const;

export type GraphNodeType = keyof typeof graphTypeLabels;

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  meta: string;
  description: string;
  radius: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphLink {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  relation: string;
}

const radii: Record<GraphNodeType, number> = {
  person: 15, company: 11, position: 9, work: 7, project: 8,
  technology: 5, recognition: 7, education: 8,
};

function formatMonth(value: string | null) {
  if (!value) return "Present";
  return new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

export function buildGraph(data: PortfolioData) {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const nodeById = new Map<string, GraphNode>();
  const edgeIds = new Set<string>();

  function addNode(node: Omit<GraphNode, "radius">) {
    const existing = nodeById.get(node.id);
    if (existing) return existing;
    const complete = { ...node, radius: radii[node.type] };
    nodes.push(complete);
    nodeById.set(complete.id, complete);
    return complete;
  }

  function addLink(source: string, target: string, relation: string) {
    const id = `${source}|${relation}|${target}`;
    if (edgeIds.has(id)) return;
    edgeIds.add(id);
    links.push({ id, source, target, relation });
  }

  const personId = "person:sumedh";
  addNode({ id: personId, type: "person", label: data.profile.name, meta: `${data.profile.role} · ${data.profile.location}`, description: data.profile.summary });

  data.companies.forEach((company) => addNode({ id: `company:${company.id}`, type: "company", label: company.name, meta: company.displayLocation, description: company.description }));
  data.positions.forEach((position) => {
    const company = data.companies.find((candidate) => candidate.id === position.companyId);
    const id = `position:${position.id}`;
    addNode({ id, type: "position", label: position.title, meta: `${formatMonth(position.startDate)} — ${formatMonth(position.endDate)}`, description: position.description });
    addLink(personId, id, "held role");
    addLink(id, `company:${position.companyId}`, `at ${company?.name ?? "company"}`);
  });

  function addTechnology(label: string) {
    const cleanLabel = label.trim();
    const id = `technology:${cleanLabel.toLocaleLowerCase()}`;
    addNode({ id, type: "technology", label: cleanLabel, meta: "Technology or practice", description: `Connected wherever ${cleanLabel} appears in the résumé or project record.` });
    return id;
  }

  data.professionalWork.forEach((work) => {
    const id = `work:${work.id}`;
    const company = data.companies.find((candidate) => candidate.id === work.companyId);
    addNode({ id, type: "work", label: work.title, meta: `${company?.name ?? "Company"} · ${work.status}`, description: `${work.description} ${work.impact}` });
    addLink(`company:${work.companyId}`, id, "shipped");
    work.tags.forEach((tag) => addLink(id, addTechnology(tag), "uses"));
  });

  data.projects.forEach((project) => {
    const id = `project:${project.id}`;
    addNode({ id, type: "project", label: project.title, meta: `${project.kind} · ${project.status}`, description: project.description });
    addLink(personId, id, "built");
    project.tags.forEach((tag) => addLink(id, addTechnology(tag), "uses"));
  });

  data.skills.forEach((group) => group.items.forEach((item) => addLink(personId, addTechnology(item), "works with")));
  data.recognition.forEach((recognition) => {
    const id = `recognition:${recognition.id}`;
    addNode({ id, type: "recognition", label: recognition.title, meta: recognition.year, description: recognition.note });
    addLink(personId, id, "earned");
    if (recognition.companyId) addLink(id, `company:${recognition.companyId}`, "awarded by");
  });
  data.education.forEach((education) => {
    const id = `education:${education.id}`;
    addNode({ id, type: "education", label: education.institution, meta: `${education.shortDegree} · ${education.startYear}—${education.endYear}`, description: `${education.degree} · CGPA ${education.cgpa}.` });
    addLink(personId, id, "studied at");
  });

  return { nodes, links, nodeById };
}

export function graphNodeId(value: string | GraphNode) {
  return typeof value === "string" ? value : value.id;
}
