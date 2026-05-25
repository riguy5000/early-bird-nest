
DO $$
DECLARE
  v_store uuid := 'adc23e66-d15b-4517-9435-40ba3247047e';
  v_batch uuid := '11111111-1111-1111-1111-111111111111';
  i int;
  v_cat text; v_sub text; v_metal text; v_karat text;
  v_weight numeric; v_factor numeric; v_spot numeric;
  v_market numeric; v_cost numeric; v_dispo text; v_loc text;
  v_desc text; v_metals jsonb; v_watch jsonb;
  v_metal2 text; v_karat2 text; v_weight2 numeric; v_factor2 numeric; v_spot2 numeric;
  v_rand numeric;
  jewelry_types text[] := ARRAY['Chain','Bracelet','Ring','Earrings','Pendant','Necklace','Bangle','Cufflinks','Brooch'];
  bullion_types text[] := ARRAY['Bar','Coin','Round','Ingot'];
  watch_brands text[] := ARRAY['Rolex','Omega','Tag Heuer','Seiko','Cartier','Tudor'];
  gold_karats text[] := ARRAY['10K','14K','18K','22K','24K'];
  silver_karats text[] := ARRAY['925','999'];
BEGIN
  -- Wipe
  DELETE FROM scrap_batch_activity WHERE batch_id IN (SELECT id FROM scrap_batches WHERE store_id = v_store);
  DELETE FROM scrap_batch_items WHERE batch_id IN (SELECT id FROM scrap_batches WHERE store_id = v_store);
  DELETE FROM scrap_batches WHERE store_id = v_store;
  DELETE FROM inventory_status_history WHERE item_id IN (SELECT id FROM inventory_items WHERE store_id = v_store);
  DELETE FROM inventory_items WHERE store_id = v_store;
  DELETE FROM inventory_batches WHERE store_id = v_store;
  DELETE FROM refinery_lots WHERE store_id = v_store;
  DELETE FROM refiners WHERE store_id = v_store;
  DELETE FROM customers WHERE store_id = v_store;

  -- Seed batch
  INSERT INTO inventory_batches (id, store_id, total_items, total_payout, source, status, batch_notes)
  VALUES (v_batch, v_store, 150, 0, 'manual', 'active', 'Seed data');

  -- Seed 150 items
  FOR i IN 1..150 LOOP
    v_rand := random();
    IF v_rand < 0.7 THEN
      v_cat := 'Jewelry'; v_sub := jewelry_types[1 + floor(random() * array_length(jewelry_types,1))::int];
    ELSIF v_rand < 0.9 THEN
      v_cat := 'Bullion'; v_sub := bullion_types[1 + floor(random() * array_length(bullion_types,1))::int];
    ELSE
      v_cat := 'Watches'; v_sub := watch_brands[1 + floor(random() * array_length(watch_brands,1))::int];
    END IF;

    -- pick metal
    v_rand := random();
    IF v_rand < 0.6 THEN
      v_metal := 'Gold'; v_karat := gold_karats[1 + floor(random() * 5)::int]; v_spot := 2400;
      v_factor := CASE v_karat WHEN '10K' THEN 0.4167 WHEN '14K' THEN 0.5833 WHEN '18K' THEN 0.75 WHEN '22K' THEN 0.9167 ELSE 0.999 END;
    ELSIF v_rand < 0.85 THEN
      v_metal := 'Silver'; v_karat := silver_karats[1 + floor(random() * 2)::int]; v_spot := 30;
      v_factor := CASE v_karat WHEN '925' THEN 0.925 ELSE 0.999 END;
    ELSIF v_rand < 0.95 THEN
      v_metal := 'Platinum'; v_karat := '950'; v_spot := 950; v_factor := 0.95;
    ELSE
      v_metal := 'Palladium'; v_karat := '950'; v_spot := 1000; v_factor := 0.95;
    END IF;

    v_weight := round((1.5 + random() * 83.5)::numeric, 2);
    v_market := round((v_weight * v_factor / 31.1035 * v_spot)::numeric, 2);
    v_metals := jsonb_build_array(jsonb_build_object('type', v_metal, 'karat', v_karat, 'weight', v_weight));

    -- 15% second metal on jewelry
    IF v_cat = 'Jewelry' AND random() < 0.15 THEN
      v_metal2 := (ARRAY['Gold','Silver','Platinum','Palladium'])[1 + floor(random()*4)::int];
      IF v_metal2 = v_metal THEN v_metal2 := 'Silver'; END IF;
      IF v_metal2 = 'Gold' THEN
        v_karat2 := gold_karats[1 + floor(random()*5)::int]; v_spot2 := 2400;
        v_factor2 := CASE v_karat2 WHEN '10K' THEN 0.4167 WHEN '14K' THEN 0.5833 WHEN '18K' THEN 0.75 WHEN '22K' THEN 0.9167 ELSE 0.999 END;
      ELSIF v_metal2 = 'Silver' THEN
        v_karat2 := silver_karats[1 + floor(random()*2)::int]; v_spot2 := 30;
        v_factor2 := CASE v_karat2 WHEN '925' THEN 0.925 ELSE 0.999 END;
      ELSIF v_metal2 = 'Platinum' THEN
        v_karat2 := '950'; v_spot2 := 950; v_factor2 := 0.95;
      ELSE
        v_karat2 := '950'; v_spot2 := 1000; v_factor2 := 0.95;
      END IF;
      v_weight2 := round((0.5 + random() * 9.5)::numeric, 2);
      v_metals := v_metals || jsonb_build_object('type', v_metal2, 'karat', v_karat2, 'weight', v_weight2);
      v_market := v_market + round((v_weight2 * v_factor2 / 31.1035 * v_spot2)::numeric, 2);
      v_weight := v_weight + v_weight2;
    END IF;

    v_cost := round((v_market * (0.55 + random() * 0.23))::numeric, 2);

    v_rand := random();
    IF v_rand < 0.6 THEN v_dispo := 'Undecided';
    ELSIF v_rand < 0.85 THEN v_dispo := 'Scrap Candidate';
    ELSIF v_rand < 0.95 THEN v_dispo := 'Showroom Candidate';
    ELSE v_dispo := 'Investment Candidate'; END IF;

    v_loc := CASE WHEN v_dispo = 'Showroom Candidate' THEN 'showroom' ELSE 'safe' END;

    IF v_cat = 'Bullion' THEN
      v_desc := v_weight || 'g ' || v_metal || ' ' || v_karat || ' ' || v_sub;
      v_watch := '{}'::jsonb;
    ELSIF v_cat = 'Watches' THEN
      v_desc := v_sub || ' Watch';
      v_watch := jsonb_build_object('brand', v_sub);
    ELSE
      v_desc := v_karat || ' ' || v_metal || ' ' || v_sub;
      v_watch := '{}'::jsonb;
    END IF;

    INSERT INTO inventory_items (
      store_id, batch_id, category, subcategory, description, disposition, processing_status,
      metals, watch_info, weight, market_value_at_intake, payout_amount,
      estimated_scrap_value, estimated_resale_value, location, source,
      is_scrap_eligible, is_part_out_eligible
    ) VALUES (
      v_store, v_batch, v_cat, v_sub, v_desc, v_dispo, 'In Stock',
      v_metals, v_watch, v_weight, v_market, v_cost,
      v_market, v_market, v_loc, 'manual', true, true
    );
  END LOOP;
END $$;
