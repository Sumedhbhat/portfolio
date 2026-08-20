interface TagListProps {
  tags: string[];
}

export function TagList({ tags }: TagListProps) {
  return (
    <ul className="tag-list">
      {tags.map((tag) => <li key={tag}>{tag}</li>)}
    </ul>
  );
}
