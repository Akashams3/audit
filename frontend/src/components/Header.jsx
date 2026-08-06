import React from "react";
import logo from "../static/ritlogo.png"; 

function Header() {
  return (
    <div style={styles.header}>
      <img src={logo} alt="Institution logo" style={styles.logo} />
      <h2 style={styles.title}>INTERNAL QUALITY ASSURANCE CELL</h2>
    </div>
  );
}

const styles = {
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    flexShrink: 0,
    padding: "10px",
    background: "#2563eb",
    color: "white",
    height: "80px",
    width: "100%",
  },
  logo: {
    position: "absolute",
    left: "1%",
    width: "15%",
    height: "80px",
    marginRight: "15px",
    objectFit: "contain",
  },
  title: {
    fontSize: "20px",
    fontWeight: "bold",
  },
};

export default Header;
