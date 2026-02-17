/** Cube coordinate (q + r + s = 0) */
export interface HexCoord {
  q: number
  r: number
  s: number
}

export interface HexCell {
  coord: HexCoord
  key: string
}
