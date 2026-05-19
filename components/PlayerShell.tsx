"use client";

import FloatingSupport from "@/components/FloatingSupport";

import { useBrandMeta } from "@/lib/useBrandMeta";
import Image from "next/image";
import Link from "next/link";
import { DEFAULT_BRAND, fetchPublicBrand, type PublicBrand } from "@/lib/publicBrand";
import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  clearStoredSession,
  getStoredToken,
  getStoredUser,
  type StoredUser,
} from "../lib/auth";

type PlayerShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  fullWidth?: boolean;
};

type NavItem = {
  label: string;
  href: string;
  badge?: string;
};

type WalletSummary = {
  balance_available?: number;
  balance_total?: number;
  balance_pending?: number;
};

const mainNav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Casino", href: "/casino" },
  { label: "Originals", href: "/casino/originals" },
  { label: "Promotions", href: "/promotions" },
  { label: "Cashier", href: "/cashier" },
];

const accountNav: NavItem[] = [
  { label: "Profile", href: "/profile" },
  { label: "Bets", href: "/bets" },
  { label: "Provably Fair", href: "/provably-fair" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function fmtMoney(value: number | undefined | null) {
  return `$${Number(value || 0).toFixed(2)}`;
}

export default function PlayerShell({
  title,
  subtitle,
  children,
  fullWidth = false,
}: PlayerShellProps) {
  const [brand, setBrand] = useState<PublicBrand>(DEFAULT_BRAND);
  useBrandMeta(brand);
  useBrandMeta(brand);

  useEffect(() => {
    let mounted = true;
    fetchPublicBrand().then((data) => {
      if (mounted) setBrand(data || DEFAULT_BRAND);
    });
    return () => {
      mounted = false;
    };
  }, []);
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<StoredUser | null>(null);
  const [wallet, setWallet] = useState<WalletSummary | null>(null);

  const [displayBalance, setDisplayBalance] = useState(0);
  const [balancePulse, setBalancePulse] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileLike, setIsMobileLike] = useState(false);

  const balanceTargetRef = useRef(0);
  const animRef = useRef<number | null>(null);
  const prevBalanceRef = useRef<number | null>(null);
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const refreshUser = () => setUser(getStoredUser());

    refreshUser();
    window.addEventListener("storage", refreshUser);
    window.addEventListener("focus", refreshUser);
    window.addEventListener("coin2win-auth-changed", refreshUser);
    window.addEventListener("coin2win-wallet-changed", refreshUser);

    return () => {
      window.removeEventListener("storage", refreshUser);
      window.removeEventListener("focus", refreshUser);
      window.removeEventListener("coin2win-auth-changed", refreshUser);
      window.removeEventListener("coin2win-wallet-changed", refreshUser);
    };
  }, []);

  useEffect(() => {
    function syncViewportMode() {
      const mobile = window.innerWidth <= 980;
      setIsMobileLike(mobile);
      setSidebarOpen(!mobile);
    }

    syncViewportMode();
    window.addEventListener("resize", syncViewportMode);
    return () => window.removeEventListener("resize", syncViewportMode);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadWallet() {
      if (!user?.user_id) {
        setWallet(null);
        return;
      }

      try {
        const token = getStoredToken();
        const res = await fetch(`/api/wallet/${user.user_id}`, {
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          cache: "no-store",
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          if (!cancelled) setWallet(null);
          return;
        }

        if (!cancelled) {
          const nextWallet = {
            balance_available: data?.balance_available,
            balance_total: data?.balance_total,
            balance_pending: data?.balance_pending,
          };

          setWallet(nextWallet);

          const nextBalance = Number(nextWallet.balance_available || 0);
          const prevBalance = prevBalanceRef.current;

          balanceTargetRef.current = nextBalance;

          if (prevBalance === null) {
            prevBalanceRef.current = nextBalance;
            setDisplayBalance(nextBalance);
          } else {
            if (nextBalance > prevBalance) {
              setBalancePulse(true);
              if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
              pulseTimerRef.current = setTimeout(() => {
                setBalancePulse(false);
              }, 1200);
            }
            prevBalanceRef.current = nextBalance;
          }
        }
      } catch {
        if (!cancelled) setWallet(null);
      }
    }

    loadWallet();

    const handleWalletChanged = () => {
      loadWallet();
    };

    window.addEventListener("coin2win-auth-changed", handleWalletChanged);
    window.addEventListener("coin2win-wallet-changed", handleWalletChanged);

    const t = setInterval(loadWallet, 5000);

    return () => {
      cancelled = true;
      window.removeEventListener("coin2win-auth-changed", handleWalletChanged);
      window.removeEventListener("coin2win-wallet-changed", handleWalletChanged);
      clearInterval(t);
    };
  }, [user?.user_id]);

  useEffect(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);

    const animate = () => {
      setDisplayBalance((prev) => {
        const target = balanceTargetRef.current;
        const diff = target - prev;
        if (Math.abs(diff) < 0.01) return target;
        return prev + diff * 0.35;
      });

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    };
  }, []);

  function handleLogout() {
    clearStoredSession();
    setUser(null);
    setWallet(null);
    setDisplayBalance(0);
    balanceTargetRef.current = 0;
    prevBalanceRef.current = null;
    router.replace("/login");
  }

  function handleNavClick() {
    if (isMobileLike) setSidebarOpen(false);
  }

  const isLoggedIn = !!user?.user_id;

  const topButtons = useMemo(() => {
    const mobileMiniButton: CSSProperties = {
      width: 34,
      height: 34,
      minWidth: 34,
      padding: 0,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 10,
      fontSize: 15,
      fontWeight: 800,
    };

    if (isLoggedIn) {
      return (
        <>
          <Link
            href="/profile"
            style={isMobileLike ? { ...ghostButtonStyle, ...mobileMiniButton } : ghostButtonStyle}
            title="Account"
            aria-label="Account"
          >
            {isMobileLike ? "👤" : "Account"}
          </Link>
          <Link
            href="/cashier"
            style={isMobileLike ? { ...ghostButtonStyle, ...mobileMiniButton } : ghostButtonStyle}
            title="Wallet"
            aria-label="Wallet"
          >
            {isMobileLike ? "💼" : "Wallet"}
          </Link>
          <button
            onClick={handleLogout}
            style={isMobileLike ? { ...logoutTopButtonStyle, ...mobileMiniButton } : logoutTopButtonStyle}
            title="Logout"
            aria-label="Logout"
          >
            {isMobileLike ? "⎋" : "Logout"}
          </button>
        </>
      );
    }

    return (
      <>
        <Link
          href="/login"
          style={isMobileLike ? { ...ghostButtonStyle, ...mobileMiniButton } : ghostButtonStyle}
        >
          {isMobileLike ? "↪" : "Login"}
        </Link>
        <Link
          href={`/register${typeof window !== "undefined" && window.location.search ? window.location.search : ""}`}
          style={isMobileLike ? { ...primaryButtonStyle, ...mobileMiniButton } : primaryButtonStyle}
        >
          {isMobileLike ? "＋" : "Register"}
        </Link>
      </>
    );
  }, [isLoggedIn, isMobileLike]);

  const sidebarWidth = sidebarOpen ? (isMobileLike ? 260 : 220) : 0;

  return (
    <div style={pageStyle}>
      {sidebarOpen && isMobileLike ? (
        <div
          style={mobileBackdropStyle}
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside
        style={{
          ...sidebarStyle,
          width: sidebarWidth,
          minWidth: sidebarWidth,
          padding: sidebarOpen ? "16px 12px" : "0",
          borderRight:
            sidebarOpen && !isMobileLike
              ? "1px solid rgba(255,255,255,0.06)"
              : "1px solid transparent",
          transform:
            isMobileLike && !sidebarOpen ? "translateX(-100%)" : "translateX(0)",
          boxShadow:
            isMobileLike && sidebarOpen
              ? "0 0 0 1px rgba(255,255,255,0.04), 0 20px 50px rgba(0,0,0,0.35)"
              : "none",
        }}
      >
        {sidebarOpen ? (
          <>
            <div style={brandWrapStyle}>
              <Link href="/casino" style={brandLinkStyle} onClick={handleNavClick}>
                <div style={brandIconStyle}>{(brand.brand_name || "Coin2Win").replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase()}</div>
                <div>
                  <div style={brandEyebrowStyle}>{brand.brand_name || "Coin2Win"}</div>
                  <div style={brandTitleStyle}>Player Panel</div>
                </div>
              </Link>
            </div>

            <div style={sectionLabelStyle}>Casino</div>
            <nav style={navWrapStyle}>
              {mainNav.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleNavClick}
                    style={{
                      ...navItemStyle,
                      ...(active ? navItemActiveStyle : {}),
                    }}
                  >
                    <span>{item.label}</span>
                    {item.badge ? (
                      <span style={active ? badgeActiveStyle : badgeStyle}>
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>

            {isLoggedIn ? (
              <>
                <div style={{ ...sectionLabelStyle, marginTop: 22 }}>Account</div>
                <nav style={navWrapStyle}>
                  {accountNav.map((item) => {
                    const active = isActive(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={handleNavClick}
                        style={{
                          ...navItemStyle,
                          ...(active ? navItemActiveStyle : {}),
                        }}
                      >
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </>
            ) : null}

            <div style={sidebarBottomStyle}>
              <div style={playerCardStyle}>
                <div style={playerCardLabelStyle}>
                  {isLoggedIn ? "Logged in as" : "Guest session"}
                </div>
                <div style={playerCardValueStyle}>{user?.username || "Guest"}</div>
                <div style={playerCardSubStyle}>
                  {user?.email || user?.user_id || "Login to access your account"}
                </div>

                {isLoggedIn ? (
                  <div
                    style={{
                      ...sidebarWalletBoxStyle,
                      ...(balancePulse ? sidebarWalletBoxPulseStyle : {}),
                    }}
                  >
                    <div style={sidebarWalletLabelStyle}>Available Balance</div>
                    <div
                      style={{
                        ...sidebarWalletValueStyle,
                        ...(balancePulse ? sidebarWalletValuePulseStyle : {}),
                      }}
                    >
                      {fmtMoney(displayBalance)}
                    </div>
                  </div>
                ) : null}

                <div style={sidebarButtonRowStyle}>
                  {isLoggedIn ? (
                    <>
                      <Link href="/profile" style={miniGhostButtonStyle} onClick={handleNavClick}>
                        Profile
                      </Link>
                      <button onClick={handleLogout} style={logoutButtonStyle}>
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" style={miniGhostButtonStyle} onClick={handleNavClick}>
                        Login
                      </Link>
                      <Link href={`/register${typeof window !== "undefined" && window.location.search ? window.location.search : ""}`} style={registerButtonStyle} onClick={handleNavClick}>
                        Register
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </aside>

      <div style={mainWrapStyle}>
        <header style={topbarStyle}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button onClick={() => setSidebarOpen((v) => !v)} style={menuButtonStyle}>☰</button>
                  <Link href="/casino" style={{ display: "flex", alignItems: "center" }}>
                    {brand.logo_url ? (
                      <img src={brand.logo_url} style={{ width: "34px", height: "34px", objectFit: "contain", borderRadius: "8px" }} />
                    ) : (
                      <div
                        style={{
                          width: "34px",
                          height: "34px",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "11px",
                          fontWeight: 900,
                          background: `linear-gradient(135deg, ${brand.primary_color || "#00e701"}, ${brand.secondary_color || "#00c853"})`,
                          color: "#fff",
                          textTransform: "uppercase",
                        }}
                      >
                        {(brand.brand_name || "Coin2Win").replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase()}
                      </div>
                    )}
                  </Link>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {isLoggedIn && (
                    <div style={{ ...walletPillStyle, padding: "6px 10px", borderRadius: 10 }}>
                      <div style={{ fontSize: 10 }}>Balance</div>
                      <div style={{ fontSize: 14, fontWeight: 800 }}>{fmtMoney(displayBalance)}</div>
                    </div>
                  )}
                  {topButtons}
                </div>
              </div>
        </header>

        <main style={contentOuterStyle}>
          <div
            style={{
              ...innerRailStyle,
              maxWidth: fullWidth ? "100%" : innerRailStyle.maxWidth,
              padding: fullWidth ? "0 12px" : innerRailStyle.padding,
            }}
          >
            {children}
      <FloatingSupport />
          </div>
        </main>
      </div>
    </div>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr)",
  background: "#0f212e",
  color: "#ffffff",
};

const sidebarStyle: CSSProperties = {
  background: "#1a2c38",
  display: "flex",
  flexDirection: "column",
  minHeight: "100vh",
  position: "sticky",
  top: 0,
  overflow: "hidden",
  transition: "all 220ms ease",
  zIndex: 40,
};

const mobileBackdropStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  zIndex: 30,
};

const brandWrapStyle: CSSProperties = {
  marginBottom: 24,
  padding: "4px 6px",
};

const brandLinkStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  textDecoration: "none",
};

const brandIconStyle: CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 12,
  background: "linear-gradient(135deg, #00e701, #00c853)",
  color: "#071824",
  fontWeight: 900,
  fontSize: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 10px 24px rgba(0,231,1,0.18)",
};

const brandEyebrowStyle: CSSProperties = {
  color: "#b1bad3",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  marginBottom: 2,
};

const brandTitleStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  color: "#ffffff",
};

const sectionLabelStyle: CSSProperties = {
  color: "#7f8fa4",
  fontSize: 12,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  marginBottom: 10,
  padding: "0 8px",
};

const navWrapStyle: CSSProperties = {
  display: "grid",
  gap: 8,
};

const navItemStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  textDecoration: "none",
  color: "#b1bad3",
  background: "transparent",
  border: "1px solid transparent",
  borderRadius: 14,
  padding: "12px 14px",
  fontWeight: 700,
};

const navItemActiveStyle: CSSProperties = {
  color: "#ffffff",
  background: "#213743",
  border: "1px solid rgba(255,255,255,0.06)",
};

const badgeStyle: CSSProperties = {
  background: "rgba(0,231,1,0.12)",
  color: "#86efac",
  border: "1px solid rgba(0,231,1,0.18)",
  borderRadius: 999,
  padding: "4px 8px",
  fontSize: 11,
  fontWeight: 800,
};

const badgeActiveStyle: CSSProperties = {
  ...badgeStyle,
  background: "#00e701",
  color: "#071824",
  border: "1px solid transparent",
};

const sidebarBottomStyle: CSSProperties = {
  marginTop: "auto",
  paddingTop: 18,
};

const playerCardStyle: CSSProperties = {
  background: "#213743",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 16,
  padding: "14px",
};

const playerCardLabelStyle: CSSProperties = {
  color: "#7f8fa4",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: 8,
};

const playerCardValueStyle: CSSProperties = {
  color: "#ffffff",
  fontWeight: 800,
  fontSize: 15,
  marginBottom: 4,
};

const playerCardSubStyle: CSSProperties = {
  color: "#b1bad3",
  fontSize: 12,
  overflowWrap: "anywhere",
};

const sidebarWalletBoxStyle: CSSProperties = {
  marginTop: 12,
  background: "#13202a",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 12,
  padding: "12px",
  transition: "all 220ms ease",
};

const sidebarWalletBoxPulseStyle: CSSProperties = {
  border: "1px solid rgba(0,231,1,0.45)",
  boxShadow: "0 0 0 2px rgba(0,231,1,0.25), 0 0 35px rgba(0,231,1,0.35)",
};

const sidebarWalletLabelStyle: CSSProperties = {
  color: "#7f8fa4",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const sidebarWalletValueStyle: CSSProperties = {
  color: "#00e701",
  fontWeight: 900,
  fontSize: 22,
  marginTop: 4,
  transition: "all 220ms ease",
};

const sidebarWalletValuePulseStyle: CSSProperties = {
  color: "#86efac",
  transform: "scale(1.12)",
  textShadow: "0 0 18px rgba(0,231,1,0.28)",
};

const sidebarButtonRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
  marginTop: 14,
};

const miniGhostButtonStyle: CSSProperties = {
  textDecoration: "none",
  background: "#1a2c38",
  color: "#fff",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 10,
  padding: "10px 12px",
  fontWeight: 800,
  fontSize: 13,
  textAlign: "center",
};

const logoutButtonStyle: CSSProperties = {
  background: "rgba(239,68,68,0.14)",
  color: "#fecaca",
  border: "1px solid rgba(239,68,68,0.24)",
  borderRadius: 10,
  padding: "10px 12px",
  fontWeight: 800,
  fontSize: 13,
  cursor: "pointer",
};

const registerButtonStyle: CSSProperties = {
  textDecoration: "none",
  background: "#00e701",
  color: "#071824",
  border: "1px solid transparent",
  borderRadius: 10,
  padding: "10px 12px",
  fontWeight: 900,
  fontSize: 13,
  textAlign: "center",
};

const mainWrapStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  gridTemplateRows: "auto 1fr",
};

const topbarStyle: CSSProperties = {
  borderBottom: "1px solid rgba(255,255,255,0.05)",
  background:
    "linear-gradient(180deg, rgba(26,44,56,0.72) 0%, rgba(15,33,46,0.72) 100%)",
  backdropFilter: "blur(10px)",
  position: "sticky",
  top: 0,
  zIndex: 20,
};

const contentOuterStyle: CSSProperties = {
  width: "100%",
  padding: "16px 0 24px 0",
  boxSizing: "border-box",
};

const innerRailStyle: CSSProperties = {
  width: "100%",
  maxWidth: 1400,
  margin: "0 auto",
  padding: "0 20px",
  boxSizing: "border-box",
};

const titleRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
  minWidth: 0,
  flex: 1,
};

const menuButtonStyle: CSSProperties = {
  width: 42,
  height: 42,
  minWidth: 42,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "#213743",
  color: "#fff",
  fontSize: 20,
  fontWeight: 900,
  cursor: "pointer",
};

const titleBlockStyle: CSSProperties = {
  minWidth: 0,
  flex: 1,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 24,
  fontWeight: 800,
  lineHeight: 1.08,
  color: "#ffffff",
};

const subtitleStyle: CSSProperties = {
  margin: "6px 0 0 0",
  color: "#b1bad3",
  fontSize: 13,
  lineHeight: 1.45,
};

const topbarRightStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  flexWrap: "wrap",
  whiteSpace: "normal",
  flexShrink: 0,
  justifyContent: "flex-end",
};

const walletPillStyle: CSSProperties = {
  display: "grid",
  gap: 2,
  background: "#13202a",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 14,
  padding: "10px 12px",
  minWidth: 120,
  transition: "all 220ms ease",
};

const walletPillPulseStyle: CSSProperties = {
  border: "1px solid rgba(0,231,1,0.42)",
  boxShadow: "0 0 0 2px rgba(0,231,1,0.25), 0 0 35px rgba(0,231,1,0.35)",
  transform: "translateY(-1px)",
};

const walletPillLabelStyle: CSSProperties = {
  color: "#7f8fa4",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const walletPillValueStyle: CSSProperties = {
  color: "#00e701",
  fontSize: 18,
  fontWeight: 900,
  transition: "all 220ms ease",
};

const walletPillValuePulseStyle: CSSProperties = {
  color: "#86efac",
  transform: "scale(1.12)",
  textShadow: "0 0 18px rgba(0,231,1,0.28)",
};

const ghostButtonStyle: CSSProperties = {
  textDecoration: "none",
  background: "#213743",
  color: "#ffffff",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  padding: "10px 12px",
  minWidth: 42,
  textAlign: "center",
  fontWeight: 800,
  fontSize: 13,
};

const logoutTopButtonStyle: CSSProperties = {
  background: "rgba(239,68,68,0.14)",
  color: "#fecaca",
  border: "1px solid rgba(239,68,68,0.24)",
  borderRadius: 12,
  padding: "10px 12px",
  minWidth: 42,
  textAlign: "center",
  fontWeight: 800,
  fontSize: 13,
  cursor: "pointer",
};

const primaryButtonStyle: CSSProperties = {
  textDecoration: "none",
  background: "#00e701",
  color: "#071824",
  border: "1px solid transparent",
  borderRadius: 12,
  padding: "10px 12px",
  minWidth: 42,
  textAlign: "center",
  fontWeight: 900,
  fontSize: 13,
  boxShadow: "0 10px 24px rgba(0,231,1,0.16)",
};
