import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import PostDetailClient from "./PostDetailClient";

export interface Post {
  title: string;
  teamName: string;
  teamDescription: string;
  teamImageUrl?: string;
  whitelistId?: string;
  lookupTableAddress: string;
  teamAddress?: string;
  teamHomepage?: string;
}

interface PostDetailPageProps {
  params: {
    lng: string;
    lookupTableAddress: string;
  };
}

const PostDetailPage = async ({ params }: PostDetailPageProps) => {
  const { lookupTableAddress } = params;
  const docRef = doc(db, "lookupTables", lookupTableAddress);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return <div>Post not found</div>;
  }

  const post = docSnap.data() as Post;

  return <PostDetailClient post={post} params={params} />;
};

export default PostDetailPage;
