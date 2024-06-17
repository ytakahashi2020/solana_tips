"use client";

import React, { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase";
import Link from "next/link";
import { LngButton } from "../../components/LngButton/client";
import { useTranslation } from "@/i18n/client";
import { PageParams } from "../../types/params";
import { getProjectMemberCount } from "../../components/utils";
import Modal from "react-modal";

export interface Post {
  teamName: string;
  teamImageUrl: string;
  lookupTableAddress: string;
  createdAt: string; // 作成日時を追加
  // 他のフィールドがある場合はここに追加
}

const PostsPage: React.FC<PageParams> = ({ params: { lng } }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [memberCounts, setMemberCounts] = useState<{ [key: string]: number }>(
    {}
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [sortOrder, setSortOrder] = useState<string>("newest"); // ソート順の状態を追加
  const { t } = useTranslation(lng, "main");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false); // モーダルの状態を追加

  useEffect(() => {
    const fetchPosts = async () => {
      const querySnapshot = await getDocs(
        query(collection(db, "lookupTables"), orderBy("createdAt", "desc"))
      );
      const fetchedPosts = querySnapshot.docs.map(
        (doc) =>
          ({
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate().toISOString(),
          } as Post)
      );
      setPosts(fetchedPosts);
      setFilteredPosts(fetchedPosts); // 初期状態では全ての投稿を表示

      const counts: { [key: string]: number } = {};
      for (const post of fetchedPosts) {
        const count = await getProjectMemberCount(post.lookupTableAddress);
        counts[post.lookupTableAddress] = count;
      }
      setMemberCounts(counts);
    };
    fetchPosts();
  }, []);

  useEffect(() => {
    handleSort();
  }, [sortOrder, posts]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsModalOpen(true);
      } else {
        setIsModalOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleSearch = () => {
    const query = searchQuery.toLowerCase();
    const results = posts.filter(
      (post) =>
        post.teamName.toLowerCase().includes(query) ||
        post.lookupTableAddress.toLowerCase().includes(query)
    );
    setFilteredPosts(results);
  };

  const handleSort = () => {
    let sortedPosts = [...posts];
    if (sortOrder === "newest") {
      sortedPosts.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (sortOrder === "memberCount") {
      sortedPosts.sort(
        (a, b) =>
          (memberCounts[b.lookupTableAddress] || 0) -
          (memberCounts[a.lookupTableAddress] || 0)
      );
    }
    setFilteredPosts(sortedPosts);
  };

  return (
    <div>
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        contentLabel="Mobile View Warning"
        className="fixed inset-0 flex items-center justify-center z-50"
        overlayClassName="fixed inset-0 bg-gray-800 bg-opacity-75"
      >
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <h2 className="text-xl font-semibold mb-4">
            {t("main.mobile_warning.title")}
          </h2>
          <p className="text-gray-700 mb-4">
            {t("main.mobile_warning.message")}
          </p>
          <button
            onClick={() => setIsModalOpen(false)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            {t("main.mobile_warning.close")}
          </button>
        </div>
      </Modal>

      <div className="bg-top-bg w-full pt-36 pb-10  bg-cover bg-center ">
        <div className="text-center mb-9">
          <div className="flex items-center justify-center space-x-2">
            <img
              src="/images/title_logo.png"
              alt="Logo Image"
              className="h-12 w-26"
            />
            <h2 className="text-2xl font-semibold text-baseblack">
              {t("main.title1")}
            </h2>
          </div>
          <h1 className="text-5xl font-bold text-namiblue mt-4">
            <span className="mr-5">{t("main.title2-1")}</span>
            <span className="text-baseblack mr-5">{t("main.title2-2")}</span>
            <span>{t("main.title2-3")}</span>
          </h1>
        </div>
        <div className="flex justify-center mb-4">
          <div className="flex items-center space-x-5 w-full max-w-3xl">
            <Link
              href="/create"
              className="flex items-center justify-center h-full w-70 bg-namiblue text-white py-4 px-12 rounded-full shadow-xl hover:bg-blue-800 text-center "
            >

             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="w-5 h-5 mr-2">
              <path fill="white" d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"/>
            </svg>
              {t("main.create_project")}
            </Link>
            <div className="flex items-center flex-1">
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("main.search_placeholder")}
                  className="p-4 pl-12 w-full border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 border-baseblack shadow-xl"
                />
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">

                  <svg
                    className="w-5 h-5 text-gray-200"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="gray-200"
                    viewBox="0 0 512 512"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white pt-10 pb-32">
        <div className="flex justify-end max-w-6xl mx-auto mb-4">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg text-baseblack"
          >
            <option value="newest">{t("main.sort_newest")}</option>
            <option value="memberCount">{t("main.sort_memberCount")}</option>
          </select>
        </div>
        <div className=" grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 max-w-6xl gap-6 mx-auto">
          {filteredPosts.map((post, index) => (
            <Link key={index} href={`/${post.lookupTableAddress}`} passHref>
              <div className="border rounded-3xl bg-gray-50 cursor-pointer overflow-hidden shadow-xl">
                {post.teamImageUrl && (
                  <img
                    src={post.teamImageUrl}
                    alt={t("main.team_image_alt")}
                    className="w-full h-40 object-cover rounded-3xl"
                  />
                )}
                <div className="p-4 h-32 flex flex-col justify-between">
                  <h2 className="text-lg font-semibold mb-2 leading-6 text-baseblack">
                    {post.teamName}
                  </h2>
                  {memberCounts[post.lookupTableAddress] !== undefined && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500">
                        {t("main.member_number")}{" "}
                        {memberCounts[post.lookupTableAddress]}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PostsPage;
