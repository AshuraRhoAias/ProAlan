import { BsGridFill } from "react-icons/bs";
import { LuChefHat } from "react-icons/lu";
import { FiSettings } from "react-icons/fi";
import "../assets/Css/Header.css";

type Permission = "tables" | "kitchen" | "config";

interface HeaderProps {
  username: string;
  permissions: Permission[];
}

function Header({ username, permissions }: HeaderProps) {
  const canTables = permissions.includes("tables");
  const canKitchen = permissions.includes("kitchen");
  const canConfig = permissions.includes("config");

  return (
    <header>
      <section className="header__content">
        <img src="" alt="Logo" className="logo" />
        <article>
          <h1>MasterFlow</h1>
          <span>{username}</span>
        </article>
      </section>

      <nav>
        {canTables && <BsGridFill fontSize={"32px"} />}
        {canKitchen && <LuChefHat fontSize={"32px"} />}
        {canConfig && <FiSettings fontSize={"32px"} />}
      </nav>
    </header>
  );
}

export default Header;
