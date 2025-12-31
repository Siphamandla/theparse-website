import { Menu } from "@/types/menu";

const menuData: Menu[] = [
  {
    id: 1,
    title: "Home",
    path: "/",
    newTab: false,
  },
  {
    id: 2,
    title: "About",
    path: "/about",
    newTab: false,
  },
  // {
  //   id: 33,
  //   title: "Careers",
  //   path: "/blog",
  //   newTab: false,
  // },
  {
    id: 3,
    title: "Contact Us",
    path: "/contact",
    newTab: false,
  },
  // {
  //   id: 4,
  //   title: "Projects",
  //   newTab: false,
  //   submenu: [
  //     {
  //       id: 41,
  //       title: "Mboma Gallery",
  //       path: "/about",
  //       newTab: false,
  //     },
  //     {
  //       id: 42,
  //       title: "Neolytics",
  //       path: "/contact",
  //       newTab: false,
  //     },
  //     {
  //       id: 43,
  //       title: "EGCA Consulting",
  //       path: "/blog",
  //       newTab: false,
  //     },
  //   ],
  // },
];
export default menuData;
