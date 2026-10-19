# Resolve unlisted campus addresses through their selected institution

The campus admin entered “Ring Road, Dikeni, 5700” for Alice (University of
Fort Hare). Google recognizes the address, but OpenStreetMap/Nominatim has no
matching street result. The selected institution does resolve to its mapped
Alice campus in OpenStreetMap. Current campus geocoding tries the entered
address and campus name, but does not try the selected institution's mapped
campus result.

Extend the server-side campus geocoding context so `createCampus` can pass the
selected institution name as a final fallback query after the complete address
and campus-name queries. Retain the existing South Africa geocoder and campus
locality validation; never accept a result in an unrelated city/region. Keep
address-level matches preferred over campus/institution fallback matches.
Do not call Google from the browser or introduce a new provider, credentials,
or database changes.

Add focused geocode tests proving the institution fallback is attempted only
after the address and campus-name queries fail, and that an institution result
outside the selected locality remains rejected. Update the campus controller
test to confirm it passes the selected institution name to geocoding.

Run the relevant geocoding and campus controller tests and backend TypeScript
validation.
