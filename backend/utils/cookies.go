package utils

import (
	"net/http"
	"strings"
)

func cookieHostWithoutPort(r *http.Request) string {
	host := r.Host
	// r.Host can be "example.com:8080"
	if i := strings.IndexByte(host, ':'); i >= 0 {
		host = host[:i]
	}
	return host
}

func isLocalhostRequest(r *http.Request) bool {
	host := cookieHostWithoutPort(r)
	return host == "localhost" || host == "127.0.0.1" || host == "0.0.0.0"
}

// SessionCookieSettings returns cookie flags that work in both:
// - localhost dev (HTTP): SameSite=Lax, Secure=false
// - production behind a proxy (HTTPS): SameSite=None, Secure=true
func SessionCookieSettings(r *http.Request) (secure bool, sameSite http.SameSite) {
	if isLocalhostRequest(r) {
		return false, http.SameSiteLaxMode
	}

	forwardedProto := strings.ToLower(r.Header.Get("X-Forwarded-Proto"))
	isHTTPS := r.TLS != nil || forwardedProto == "https"

	// For SameSite=None, browsers require Secure=true.
	// In production we force Secure=true even if TLS is terminated upstream.
	if isHTTPS {
		return true, http.SameSiteNoneMode
	}
	return true, http.SameSiteNoneMode
}
