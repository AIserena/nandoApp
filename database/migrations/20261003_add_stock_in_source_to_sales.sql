ALTER TABLE detailpenjualan
    ADD COLUMN NoStokIn VARCHAR(50) NULL AFTER KodeBarang,
    ADD INDEX idx_detailpenjualan_stokin_barang (NoStokIn, KodeBarang);
