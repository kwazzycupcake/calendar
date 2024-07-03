
package com.example.demo;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.logging.Logger;

@SpringBootApplication
@RestController
public class DemoApplication {

	private static final Logger LOGGER = Logger.getLogger(DemoApplication.class.getName());

	public static void main(String[] args) {
		SpringApplication.run(DemoApplication.class, args);
	}

	private String fetchingQuery(LocalDate startDate, LocalDate endDate, String cluster) {
		String urlString = "https://sqlapp.adobeconnect.com/query1";
		String cookie = "session=eyJsb2dnZWRfaW4iOnRydWUsImRpc3BsYXlfbmFtZSI6IkJoYXZhbmEgLiIsInVzZXJuYW1lIjoiYmhhdiJ9.ZlxWcw.BsxjsZC7xWj8IzKjaOsJBrvMHk8; BREEZESESSION=breezbreezbqdhdyyw2gxabncw";

		DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");


		String sqlQuery = "select * from pps_acl_fields paf \n" +
				"JOIN pps_scos ps ON paf.acl_id=ps.account_id \n" +
				"left JOIN (select * from pps_acl_fields where field_id=1238)paf2 ON paf2.acl_id=ps.sco_id\n" +
				"JOIN pps_accounts pa ON ps.account_id=pa.account_id\n" +
				"where paf.field_id=1150 and ps.type=16"+
				"AND CONVERT(date, ps.date_begin) >= '" + startDate.format(formatter) + "' " +
				"AND CONVERT(date, ps.date_end) <= '" + endDate.format(formatter) + "';";

		LOGGER.info("SQL Query: " + sqlQuery);
		String payload = buildPayload(sqlQuery, cluster);

		try {
			URL url = new URL(urlString);
			HttpURLConnection connection = (HttpURLConnection) url.openConnection();
			connection.setRequestMethod("POST");
			connection.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
			connection.setRequestProperty("Cookie", cookie);
			connection.setDoOutput(true);
			byte[] payloadBytes = payload.getBytes(StandardCharsets.UTF_8);
			connection.setRequestProperty("Content-Length", String.valueOf(payloadBytes.length));

			try (OutputStream os = connection.getOutputStream()) {
				os.write(payloadBytes);
			}

			int responseCode = connection.getResponseCode();

			if (responseCode == HttpURLConnection.HTTP_OK) {
				BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
				StringBuilder response = new StringBuilder();
				String line;

				while ((line = reader.readLine()) != null) {
					response.append(line);
				}

				reader.close();

				ObjectMapper mapper = new ObjectMapper();
				JsonNode jsonNode = mapper.readTree(response.toString());

				return jsonNode.toPrettyString();
			} else {
				LOGGER.severe("Request failed with response code: " + responseCode);
				return createErrorResponse("Request failed with response code: " + responseCode);
			}

		} catch (IOException e) {
			LOGGER.severe("Error occurred while fetching data: " + e.getMessage());
			e.printStackTrace();
			return createErrorResponse("Error occurred while fetching data.");
		}
	}

	private String buildPayload(String sqlQuery, String cluster) {
		String database = ".";
		return "cluster=" + cluster + "&sqlquery=" + encodeQuery(sqlQuery) + "&database=" + database;
	}

	private String encodeQuery(String sqlQuery) {
		return java.net.URLEncoder.encode(sqlQuery, StandardCharsets.UTF_8);
	}

	private String createErrorResponse(String message) {
		ObjectMapper mapper = new ObjectMapper();
		ObjectNode errorNode = mapper.createObjectNode();
		errorNode.put("error", message);
		return errorNode.toString();
	}

	@CrossOrigin(origins = "http://localhost:3000")
	@GetMapping("/fetchData")
	public String fetchData(@RequestParam("startDate") String startDate,
							@RequestParam("endDate") String endDate,
							@RequestParam("cluster") String cluster) {
		LocalDate start = LocalDate.parse(startDate);
		LocalDate end = LocalDate.parse(endDate);
		return fetchingQuery(start, end, cluster);
	}
}

