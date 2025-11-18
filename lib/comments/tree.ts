import { Comment, EntityCommentsTree } from './types';

function addSingleCommentToTree(
  entityCommentsTree: EntityCommentsTree,
  newComment: Comment,
  newlyAdded?: boolean
): EntityCommentsTree {
  // Defensive mechanism from Replyke: ensure we don't add replies if their parent comment isn't present in the tree.
  if (newComment.parentId && !entityCommentsTree[newComment.parentId]) {
    console.warn('Trying to add a reply to a non-existent parent.', newComment);
    return entityCommentsTree;
  }

  // Create a mutable copy for modifications
  const newTree = { ...entityCommentsTree };

  if (newComment.parentId) {
    // It's a reply. Add it to the parent's `replies` object.
    const parentNode = newTree[newComment.parentId];
    if (parentNode) {
      parentNode.replies = {
        ...parentNode.replies,
        [newComment.id]: { ...newComment, new: !!newlyAdded },
      };
    }
  }

  // Add the comment itself as a top-level node in the tree for quick lookups.
  // This helps when its own replies are added later.
  newTree[newComment.id] = {
    comment: newComment,
    replies: newTree[newComment.id]?.replies || {}, // Preserve existing replies if any
    new: !!newlyAdded,
  };

  return newTree;
}


export function buildCommentsTree(
  comments: Comment[],
): EntityCommentsTree {
  let tree: EntityCommentsTree = {};

  // Sort comments to ensure parents are processed before children
  const sortedComments = [...comments].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  for (const comment of sortedComments) {
    tree = addSingleCommentToTree(tree, comment, false);
  }

  return tree;
}
