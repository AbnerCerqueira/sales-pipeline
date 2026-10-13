import type { Comment } from "../../src/modules/comment/comment.ts";
import type {
  CommentRepository,
  CommentWithSeller,
} from "../../src/modules/comment/comment-repository.ts";

export class MockCommentRepository implements CommentRepository {
  private comments: CommentWithSeller[] = [];

  willList(comments: CommentWithSeller[]) {
    this.comments = comments;
  }

  create(_comment: Comment) {
    return Promise.resolve();
  }

  findByDealId() {
    return Promise.resolve(this.comments);
  }
}
