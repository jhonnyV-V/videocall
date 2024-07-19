package server

type Offer struct {
	Type string `json:"type"`
	Sdp  string `json:"sdp"`
}
